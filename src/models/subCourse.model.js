"use strict";
const mongoose = require("mongoose");

const subCourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SubCourse", subCourseSchema);