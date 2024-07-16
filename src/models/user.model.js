'use strict';
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    dob: {
      type: Date,
      required: false,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
    quizCount: {
      type: Number,
      default: 0,
    },
    quizLimit: {
      type: Number,
      default: 3,
    },
    gender: {
      type: String,
      enum: ['Nam', 'Nữ', 'Khác'],
      required: false,
    },

    filename: {
      type: String,
    },

    image_url: {
      type: String,
    },

    email: String,

    loginName: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Center',
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],

    quizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
      },
    ],

    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true,
      },
    ],

    isBlock: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    cmnd: String,
    address: String,
    cap: String,
    donvi: String,
    donvicon: String,
    testCount: Number,
  },
  {
    timestamps: true,
  }
);

userSchema.methods.deactivate = async function () {
  this.status = 'inactive';
  await this.save();

  // Remove all the related docs
  await this.model('Course').updateMany(
    {students: this._id},
    {$pull: {students: this._id}}
  );
  await this.model('UserLesson').deleteMany({user: this._id});
  await this.model('Score').deleteMany({user: this._id});
};

module.exports = mongoose.model('User', userSchema);
