"use strict";
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    nameCenter: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
    },
    image_url: {
      type: String,
    },
      banner_name: {
          type: String,
          required: false,
      },
      banner_url: {
          type: String,
          required: false,
      },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    teacherQuizzes: [
      {
        teacherId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        quizCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    quizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
    ],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    showCourse: {
      type: Boolean,
      default: true,
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
    },

    notifications: [
      {
        message: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Course", courseSchema);
