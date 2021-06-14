const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllReview = factory.getAll(Review);

exports.setTourUserIds = (req, res, next) => {
  //if you dnt understand this twoline then just check last para (commented) of review model
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = factory.createOne(Review);

exports.getReview = factory.getOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.UpdateOne(Review);
