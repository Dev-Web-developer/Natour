const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have name'],
      unique: true,
      trim: true,
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      // validate: [
      //   validator.isAlpha,
      //   'A tour name must be only contain characters',
      // ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour mush have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour mush have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty can either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be above 1.0'],
      max: [5, 'rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, //to round the value
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have price'],
    },
    priceDiscount: {
      type: Number,
      //this only points on current doc on new doc created and not on update
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discout Price ({VALUE}) should be below the regular price',
      },
    },
    summary: {
      type: String,
      //it is only for string which remove all white space from begning and at the end
      trim: true,
      required: [true, 'A tour must have description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have cover image'],
    },
    //an array of many strings
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    //it is an embeded object and not for schema type options as we specified up
    startLocation: {
      //Geojson
      type: {
        type: String,
        default: 'Point', //but we can specify line polygon and other geometry on map
        enum: ['Point'], //i.e we are restricting other geometry
      },
      coordinates: [Number], //array of numbers which has coordinates of points logitude first then latitude
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// tourSchema.index({ price: 1 }); //1 stands for asscending ND -1 FOR descending

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); //always when we are using geo special data

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//=========================== virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //this is field where in child model parent model lives
  localField: '_id', //this is place which is called in parent model while in child model this called tour....
  //here parent is tour and child is review
});

//========================== Document Middleware:runs before current doc .save() or .create() not on .inserMany()

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//this is demostration of embedding user doc to tour doc "data modelling" but due to various reasons we are not embeding but refrecing data which is another method to model data
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
//for refrecing I have done on query middle ware "pre" this.populate varo

// //Just like above but it runs after doc is saved and so it has acessec to save doc
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//================================== Query Middleware

//here this key word points current query and doc
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  //this is query and so we can chain all methods on it.
  this.find({ secretTour: { $ne: true } });
  this.Start = Date.now();
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// tourSchema.post(/^find/, function (doc, next) {
//   console.log(`query took ${Date.now() - this.Start} milliseconds`);
//   next();
// });

//======================== Aggregation middleware
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
