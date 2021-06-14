const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  //1) Get tour data from collection
  const tours = await Tour.find();

  //2) Build tempelate

  //3) render tempelate

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1) get data for requested tour (including reviews and tour guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) return next(new AppError('There is no tour with that name', 404));
  //2) build tempelate

  //3) render tempelate using data from 1

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com",
      "script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.0/axios.min.js 'unsafe-inline' 'unsafe-eval';"
    )
    .render('login', {
      title: 'Log into your account',
    });
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1)find bookings
  const bookings = await Booking.find({ user: req.user.id });

  //2) find tours with returned Id's
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

//update using api

// exports.updateUserData = catchAsync(async (req, res, next) => {
//   const updatedUser = await User.findByIdAndUpdate(
//     req.user.id,
//     {
//       name: req.body.name,
//       email: req.body.email,
//     },
//     {
//       new: true,
//       runValidators: true,
//     }
//   );
//   res.status(200).render('account', {
//     title: 'Your account',
//     user: updatedUser,
//   });
// });
exports.getResetLink = catchAsync(async (req, res) => {
  res.status(200).render('resetLink', {
    title: 'Reset Password',
  });
});
exports.getResetPassword = catchAsync(async (req, res) => {
  res.status(200).render('resetPassword', {
    title: 'Reset Password',
    token: req.params.token,
  });
});
