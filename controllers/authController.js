const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 //90 days to "ms"
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  //remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'sucess',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) check is password or email exist
  if (!email || !password) {
    return next(
      new appError('Please provide valid pssword and email address!', 400)
    );
  }

  //2) check is user exist and password is corect

  //+password means we are selecting or getting it again from our data base as we are excluded in schema in (auth controller in password select false to hide from user in response) but now here in "user" will get an object from db containing password and email

  const user = await User.findOne({ email: email }).select('+password');
  //to compare password as we have encrypted it and then stored it in db we need to compare it using same lib. and not by symply "==" signs

  //if u are guessing from where this fun came then just check the user model and find thid fun and explaination....

  // const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password'), 401);
  }

  //3) if everything is ok send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1)Get token and check is it exist
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError(
        'You are not logged in! Please login first to get access',
        401
      )
    );
  }

  //2)validate token/verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)check is user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  //4)check if user changed password after token is issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  //Grant acess
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//only for render pages so there will be no error!
exports.isloggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //2)check is user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //3)check if user changed password after token is issued
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }

      //There is a loggedin user

      //this "user"  will be accessible from our pug tempelate. until now we are passing from middle ware to another middleware like: req.user = currentUser but now we are passing to pug
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

//as we canot pass argument in middleware so we are making wraper fun. which return middle ware fun.
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array
    //also here i got access of req.user.role from last middle ware which is protect which is always run before this middle ware and in that middle ware last secod line we specifie new user.....somthing check it...!
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform such action!', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)Get User bassed on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no such email address.', 404));
  }

  //2)then generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3)send it back as email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    console.log(resetURL);

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error while sending the email.Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)  get user bassed on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.body.token)
    .digest('hex');

  const user = await User.findOne({
    PasswordResetToken: hashedToken,
    PasswordResetExpires: { $gt: Date.now() },
  });

  //2)if token is not expired and there is a user we reset password
  if (!user) {
    return next(new appError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.PasswordResetToken = undefined;
  user.PasswordResetExpires = undefined;
  await user.save();
  //3)update changed passwordAt property for current user
  //in pre middleware step 3
  //4)log user in ie send jwt

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  //2)Check if posted current password is correct
  if (
    !user ||
    !(await user.correctPassword(req.body.passwordCurrent, user.password))
  ) {
    return next(
      new AppError('Incorrect current password please try again', 401)
    );
  }

  //3)if password is correct then upadte password with new one
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4)log user in, send JWT
  createSendToken(user, 200, res);
});
