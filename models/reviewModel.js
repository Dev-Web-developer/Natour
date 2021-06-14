const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      trim: true,
      required: [true, 'Review cannot be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must required to a tour.'],
      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must required to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//it prevents the multiple review bu one user on same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: '-guides name',
  // }).populate({
  //   path: 'user',
  //   select: '-_id name photo',
  // });
  next();
});

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: '-_id name photo',
  });
  next();
});

//this is a static method and not a instance method(used on doc) static method are used on models and we are using aggregate method as it is related to stats and aggregate is always on model so we are using static so that this keyword will point to model and not on doc..
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].averageRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function (next) {
  //this points to current doc
  this.constructor.calcAverageRatings(this.tour); // we written this as static method are on model itself and as you see model is created after this fun. of code and so are making model by constructor and then calling fun.
  // Review.calcAverageRatings(this.tour)
  //post middle ware does not have next()
});

//now we also want ratingquantity and ratingaverage both update on when review update and deleted so for that we used updateone and deleteone in controller but for that operation we dont have doc. middleware as doc. middleware are just for create and save and so this key word is not on doc but on query we passed in so in order to get doc we trick it as (const r)....which will return the document.
//also in pre updated data in not present so we cannot calc. and we use post instead then this will not point to current query so we split into two fun.

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // const r = await this.findOne();
  this.r = await this.findOne(); //we are passing from pre to post middle ware in order to call calcAvgRtg fun. instead of just saving r...
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

/*
now in this dev. mode we are passing user id and tour id from body to create new review and as review needs to user and tour we get it from body but its not how real world website works 
instead we can take tour id from url and then user id get from currently looged in user i.e from protect middleware....
ex:- POST /tour/(263576523)tour-id/review 

this will get all the reviews for this tour 
ex:- GET /tour/(263576523)tour-id/review 

this will get review of this tour of this id so only one review...
ex:- GET /tour/263576523(id of tour)/review/52634653276(id of review) 
*/
