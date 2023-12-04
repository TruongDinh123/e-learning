"use strict";
const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  videos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoLesson",
    },
  ],
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: false,
  },
});

module.exports = mongoose.model("Lesson", lessonSchema);
