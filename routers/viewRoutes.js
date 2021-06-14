const express = require('express');
const viewController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get(
  '/',
  bookingController.createBookingCkeckout,
  authController.isloggedIn,
  viewController.getOverview
);
router.get('/tour/:slug', authController.isloggedIn, viewController.getTour);
router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-tours', authController.protect, viewController.getMyTours);

// login route controller and tempelate

router.get('/login', viewController.getLoginForm);
router.get('/resetlink', viewController.getResetLink);
router.get(
  '/api/v1/users/resetPassword/:token',
  viewController.getResetPassword
);

//updateing using api
// router.post(
//   '/submit-user-data',
//   authController.protect,
//   viewController.updateUserData
// );

module.exports = router;
