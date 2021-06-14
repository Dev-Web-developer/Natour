const AppError = require('../utils/appError');

const handleCasteErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 404);

const handleJWTExpiredError = () =>
  new AppError('Your Token has been expired! please login again', 401);

const handleDuplicateFieldsDB = (err) => {
  let x = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/);
  const message = `Duplicate field Value: ${x[0]}. please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorsDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid Input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    //api
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // Render website
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};
const sendErrorProd = (err, req, res) => {
  //for api
  if (req.originalUrl.startsWith('/api')) {
    //operational error or trusted error which we can show to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        msg: err.message,
      });
    }
    //programming error where we cannot leak details of error
    //1)log error for us
    console.error('ERROR 💥', err);

    //2)Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
  //Render website
  //operational error or trusted error which we can show to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
    //programming error where we cannot leak details of error
  }
  //1)log error for us
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let Newerror = Object.assign(err);

    if (Newerror.name === 'CastError') Newerror = handleCasteErrorDB(Newerror);
    if (Newerror.code === 11000) Newerror = handleDuplicateFieldsDB(Newerror);
    if (Newerror.name === 'ValidationError')
      Newerror = handleValidationErrorsDB(Newerror);
    if (Newerror.name === 'JsonWebTokenError') Newerror = handleJWTError();
    if (Newerror.name === 'TokenExpiredError')
      Newerror = handleJWTExpiredError();

    sendErrorProd(Newerror, req, res);
  }
};
