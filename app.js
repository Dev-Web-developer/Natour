const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const ExpressMongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routers/tourRoutes');
const userRouter = require('./routers/userRoutes');
const reviewRouter = require('./routers/reviewRouts');
const viewRouter = require('./routers/viewRoutes');
const bookingRouter = require('./routers/bookingRoutes');
const SMTPPool = require('nodemailer/lib/smtp-pool');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//========================== Global Middlewares =============================

//serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

//Set Security for http header
app.use(cors());
// Access-Control-Allow-Origin *
// api.natours.com, front-end natours.com
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

app.options('*', cors());
// Set Security HTTP headers
// app.use(helmet()) -> This is old helmet declartion.

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'http:', 'data:'],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
    },
  })
);

//it will limit no. req that particular ip can do we set here 100 req. per hour
const limiter = rateLimit({
  max: 100,
  windows: 60 * 60 * 1000, //1 hour im ms
  message: 'Too many request from this IP, please try again in an hour!',
});

app.use('/api', limiter);

//Development loging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

//it is middle ware use to get data from body to post request
app.use(express.json({ limit: '10Kb' })); //limit body for security reason
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//Data sanitization against noSQL query injection
app.use(ExpressMongoSanitize());

//Data sanitization against xss
app.use(xss());

//prevent parameter pollution clear up query string
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//app.get('/api/v1/tours', getAllTours);
//app.get('/api/v1/tours/:id', getTour);
//app.post('/api/v1/tours', CreateNewTours);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

//============================ Routs =====================================

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

/*here is code for one who routes our api which is not exists like url is wrong or missspeled in that case it should be handeled  and so we can use middleware now one of the pro of middleware is to execute middleware in oreder it defined in code so if our req. or res. is in this line of code i.e after app.use(... tours)&app.use(... users) it means that url is wrong or that qpi rout is not present in our handler so here we define our middleware which can be execute when uch cases occured*/

//all will run for all the verbs like get patch delete etc...
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `can't find ${req.originalUrl} on this server`,
  // });
  // const err = new Error(`can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  /*whenever we pass any argument in next express will assume it as error no matteer which middleware it is or where it is and then it will break all middleware execution and from there it will go to central error handeling middleware which is right below..*/
  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

//start Express app
app.use(globalErrorHandler);

//=========================== Start server ===========================
module.exports = app;
