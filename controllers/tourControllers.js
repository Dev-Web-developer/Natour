const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

//now we have multiple images here but for diff. purpose like cover and detal but
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {

  if (!req.files.imageCover || !req.files.images) return next();

  //1) process cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //2) other images
  req.body.images = [];
  //here foreach will not work because it donot give another array and so it is not await and directly go to next() vari line so we use map which give an array of call back function and because of async call back function we get array of promises and we await all at once then go to next()
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  next();
});

//if we have just multiple images then we can use upload.array('images,maxCount:5)

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   //=================================filtering
//   //building query
//   //here if we dont destructure then query obj just have refrence of original obj and if we change in queryObj then it will change original obj so to make new obj we do this destructure and wrap to "{}" then storing (btw we are implimenting here filtering)
//   // const queryObj = { ...req.query };
//   // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//   // excludedFields.forEach((el) => {
//   //   delete queryObj[el];
//   // });

//   // //Advanced filtering
//   // //convert "gte" on url to $gte
//   // let queryString = JSON.stringify(queryObj);
//   // queryString = queryString.replace(
//   //   /\b(gte|gt|lte|lt)\b/g,
//   //   (match) => `$${match}`
//   // );
//   // let query = Tour.find(JSON.parse(queryString));

//   //Sorting

//   // if (req.query.sort) {
//   //   //if there is tie in price then just add "," in url and add another fiel like ratingAverage which will pass as :- sort('price ratingAverage')
//   //   const adQuery = req.query.sort.replace(/,/g, ' ');
//   //   query = query.sort(adQuery);
//   // } else {
//   //   query = query.sort('-createdAt');
//   // }

//   // Field Limiting for less bandwidth usage ie showing fields which is reqested for like only price or name etc
//   // if (req.query.fields) {
//   //   const fields = req.query.fields.replace(/,/g, ' ');
//   //   console.log(fields);
//   //   query = query.select(fields);
//   // } else {
//   //   query = query.select('-__v');
//   // }

//   //pagination which limit data per page ex total 100 data and 10 data per page then 10 page nedded

//   // const page = req.query.page * 1 || 1;
//   // //conveting page sting to int ane setting default value 1
//   // const limit = req.query.limit * 1 || 100;
//   // const skip = (page - 1) * limit;
//   // console.log('skip');
//   // console.log(limit);
//   // //page=2&limit=10 ie we wand second page so first page data need to be skip and secong 10 data is need to be displayed
//   // query = query.skip(skip).limit(limit);

//   // if (req.query.page) {
//   //   const numTour = await Tour.countDocuments();
//   //   if (skip >= numTour) throw new Error('This page does not exists');
//   // }
//   //Executing query

//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   //we are doing this way because we want to use .equals or .lt etc methods and that is not possible directly on find(obj) as it returns a doc. and not query obj which we can chain
//   const tours = await features.query;

//   // const query = await Tour.find()
//   //   .where('duration')
//   //   .equals(5)
//   //   .where('difficulty')
//   //   .equals('easy');

//   //send response
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours: tours,
//     },
//   });
// });

exports.CreateTour = factory.createOne(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'sucess',
//     data: null,
//   });
// });

exports.updateTour = factory.UpdateOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  //aggergation is analysing data passing each stage each stage is wrape in "{}"
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // gives diffculty of no.Of tourd num of ratings average rating of all easy,medium,hard  tours
        //_id: '$ratingsAverage',
        numTours: { $sum: 1 }, //add 1 for each of doc.
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'sucess',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStart: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStart: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'sucess',
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; //radius is converted to radians
  //actually we are taking center of sphere as point latlng and then radius of sphere as distance in miles or km then find any start location with in this sphere but to pass radius of sphere in radians...

  if (!lat || !lng)
    next(
      new AppError(
        'Please provide latitde and logitude in format like this lat,lng.',
        400
      )
    );

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'sucess',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

//it calculate start locations of all tour to your location distance
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const distanceMultiplier = unit === 'mi' ? 0.000621371 : 0.001; //our ans is in meter so it convert to miles or km
  if (!lat || !lng)
    next(
      new AppError(
        'Please provide latitde and logitude in format like this lat,lng.',
        400
      )
    );

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        // always this need to be first parameter and it need a geo index in our case we only have one geo index so need to pass that it take automatically but we have multiple then we need that
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance', //here all calculated distances will be stored
        distanceMultiplier: distanceMultiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'sucess',
    data: {
      data: distances,
    },
  });
});
