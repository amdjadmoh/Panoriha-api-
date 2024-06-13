/* eslint-disable prefer-destructuring */
const express = require('express');

const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const AppError = require('./utils/appError');
const toursRouter = require('./routes/toursRoutes');
const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const authController = require('./controllers/authController');
const Tour = require('./models/tourModel');

const app = express();

// // 1)Middlewares
// Set Security HTTP headers
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'", 'https://cdn.aframe.io'],
//       connectSrc: ["'self'", 'https://cdn.aframe.io'],
//       scriptSrc: ["'self'", "'unsafe-eval'", 'https://unpkg.com'],
//       imgSrc: ["'self'", 'data:', 'https://cdn.aframe.io'],
//       fontSrc: ["'self'", 'https://cdn.aframe.io'],

//       // ...other directives...
//     },
//   }),
// );
// app.use(
//   helmet({
//     crossOriginEmbedderPolicy: false,
//     // ...
//   }),
// );
// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//Limit requests from same API
// const limiter = rateLimit({
//   max: 1000,
//   windowMs: 60 * 60 * 1000,
//   message: 'Too many requests from this IP, please try again in an hour!',
// });
// app.use('/api', limiter);
// const whitelist = ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  // origin: function (origin, callback) {
  //   if (allowedOrigins.includes(origin)) {
  //     callback(null, true);
  //   } else {
  //     callback(new Error('Not allowed by CORS'));
  //   }
  // },
  origin: 'https://panoriha.azurewebsites.net',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
// const corsOptions = {
//   origin: function (origin, callback) {
//       callback(null, true);
//   },
//   credentials: true,
//   allowedHeaders: "*",
//   "Access-Control-Allow-Origin": "*"
// };

// app.use(cors(corsOptions));

app.use(express.json());
//Cookie parser
app.use(cookieParser());
app.get('/set-cookie', (req, res) => {
  res.cookie('myCookie', 'cookieVlaue', {
    sameSite: 'None',
  });
  res.send('cookie set successfully');
});
//Data sanitization against NoSQL query injection
app.use(mongoSanitize());
//Date sanitization against XSS
app.use(xss());
//Prevent parameter pollution
app.use(hpp({}));
//serving static files
app.use(express.static('public/dist'));
app.use(express.static(path.join(__dirname, 'public', 'build')));
app.use(express.urlencoded({ extended: true }));
// request time
app.use((req, res, next) => {
  req.requestTime = new Date().toString();
  next();
});

// 3) Routes
const sendFileTour = (req, res) => {
  const filename = req.params.filename;
  if (filename === 'scene.gltf') {
    res.sendFile(path.resolve(__dirname, 'images/tours', filename));
    // res.sendFile(path.resolve(__dirname, 'images/tours', 'scene.bin'));
  } else {
    res.sendFile(path.resolve(__dirname, 'images/tours', filename));
  }
};
const sendOther = (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.resolve(__dirname, 'images/tours/other', filename));
};
const sendFileScene = (req, res) => {
  console.log('here');
  const filename = req.params.filename;
  const tourID = req.params.tourID;
  res.sendFile(path.resolve(__dirname, 'images/tours', tourID, filename));
};
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', toursRouter);
app.get('/appiframe', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'build', 'index.html'));
});

// app.get('/images/tours/:tourID/:filename', (req, res, next) => {
//   Tour.findById(req.params.tourID)
//     .then((tour) => {
//       if (tour.isPublic) {
//         sendFileScene(req, res);
//       } else {
//         authController.protect(req, res, () => {
//           authController.restrictTo('admin', 'user')(req, res, () => {
//             authController.restrictTourToCreator(req, res, () => {
//               sendFileScene(req, res);
//             });
//           });
//         });
//       }
//     })
//     .catch(next);
// });
app.get('/images/tours/:tourID/:filename', sendFileScene);
app.get(
  '/images/tours/:filename',
  // authController.protect,
  // authController.restrictTo('admin', 'user'),
  // authController.restrictTourToCreator,
  sendFileTour,
);
app.get('/images/tours/other/:filename', sendOther);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dist', 'index.html'));
});
app.use(globalErrorHandler);
// app.set('view engine', 'ejs');
// app.set('views', 'views');
// app.get('/', (req, res) => {
//   res.render('index');
// });

module.exports = app;
