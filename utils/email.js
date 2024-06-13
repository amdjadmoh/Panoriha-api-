const nodemailer = require('nodemailer');
const catchAsync = require('./catchAsync');

const sendEmail = catchAsync(async (options) => {
  //1) Create a transporter
  console.log(process.env.EMAIL_PASSWORD);
  console.log(process.env.EMAIL_USERNAME);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // ACTIVATE IN GMAIL "LESS SECURE APP" option
  });
  //2) Define the email options
  const mailOptions = {
    from: 'Virtual Tours <virtualtours@vr.dz',
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html:
  };
  //3 Send the email
  await transporter.sendMail(mailOptions);
});
module.exports = sendEmail;
