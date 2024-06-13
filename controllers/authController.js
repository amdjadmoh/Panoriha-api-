/* eslint-disable arrow-body-style */
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const sendEmail = require('../utils/email');
const BlacklistedToken = require('../models/blackListedToken');
const { sourceMapsEnabled } = require('process');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure:true,
    sameSite: 'None',
    domain: '.panoriha.azurewebsites.net',
  };
  res.cookie('jwt', token, cookieOptions);
  // remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};
dotenv.config({ path: './config.env' });
const secretKey = process.env.JWT_SECRET; // Replace with your own secret key
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Incorrect email or password', 401));
  }
  const correct = await user.correctPassword(password, user.password);
  if (!correct) {
    return next(new AppError('Incorrect email or password', 401));
  }
  createSendToken(user, 200, res);
});
exports.logout = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('You are already logged out.', 401));
  }
  // blackList token
  await BlacklistedToken.create({ token });
  res.status(200).json({
    status: 'success',
    message: 'You are logged out',
  });
});
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  console.log(req.headers.authorization);
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }
  const blacklistedToken = await BlacklistedToken.findOne({ token });
  if (blacklistedToken) {
    return next(new AppError('You are logged out. Please log in again', 401));
  }
  //verify token
  const decoded = await promisify(jwt.verify)(token, secretKey);
  //check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('You are logged out. Please log in again', 401));
  }
  //check if user changed password after the token was issued
  if (freshUser.passwordChangedAfter(decoded.iat)) {
    return next(new AppError('You are logged out. Please log in again', 401));
  }
  //Grant ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  next();
});
exports.restrictTourToCreator = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }
  if (!req.user.tours.includes(req.params.tourID)) {
    return next(
      new AppError('You do not have permission to perform this action', 403),
    );
  }
  next();
};
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Ger user
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }
  //2) Generate the random reset
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3 send the mail to user
  const resetURL = `${req.protocol}://${req.get('host')}/resetPassword/${resetToken}`;
  const message = ` Forgot your password? click on the link to set a new password  ${resetURL}.\n if you didnt make this request just ignore this message`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'your password reset token (Valid for 10min)',
      message: message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('there was an error sending the email'), 500);
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) if token has not expired and user exists , set the new passowrd
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.status(200).json({
    status: 'success',
    message: 'Password changed!',
  });
  try {
    await sendEmail({
      email: user.email,
      subject: 'Password change',
      message: `Your password has been changed in ${new Date()}`,
    });
  } catch (err) {
    return next(
      new AppError(
        'there was an error sending the passowrd change notice email',
      ),
      500,
    );
  }
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!req.body.previousPassword) {
    return next(new AppError('Please provide your current password'), 400);
  }
  if (!(await user.correctPassword(req.body.previousPassword, user.password))) {
    return next(new AppError('Your current password is wrong'), 401);
  }
  //if so , update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPassword;
  await user.save();
  //log in user , send jwt
  createSendToken(user, 200, res);
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
exports.amIlogged = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
  });
});
