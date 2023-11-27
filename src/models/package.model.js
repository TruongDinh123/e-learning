'use strict'
const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  maxTeachers: {
    type: Number,
    required: true,
  },
  maxCoursesPerTeacher: {
    type: Number,
  },
  price: {
    type: Number,
    required: true,
  },
},
{
  timestamps: true,
});

module.exports = mongoose.model("Package", packageSchema);
