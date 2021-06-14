const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

//name , email, image,password,passwordconfirm

const userShema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide valid Email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide password'],
    validate: {
      // this only works on .save or .create and not update....
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  PasswordResetToken: String,
  PasswordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userShema.pre('save', async function (next) {
  //if password is not modified then just return from fun.
  if (!this.isModified('password')) next();

  this.password = await bcrypt.hash(this.password, 12);
  //after validating we dnt want to store confirmed password
  this.passwordConfirm = undefined;
  next();
});

userShema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userShema.pre(/^find/, function (next) {
  //this is query middle ware in which pointing to "find" or query starts with "find" and so we are adding somthing which will do not show user who is not active i.e active=false

  this.find({ active: { $ne: false } });
  next();
});

//this is instance method which avalible to all docs of particular coolection and so it can be call by any doc ex- doc.correctPassword() without any export or anything....
userShema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userShema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);

    return JWTTimestamp < changedTimestamp; //it means we generated token then password is changed and so it will return true
  }
  return false; //it means user not chanched password
};

userShema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.PasswordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.PasswordResetExpires = Date.now() + 10 * 60000;

  return resetToken;
};

const User = mongoose.model('User', userShema);

module.exports = User;
