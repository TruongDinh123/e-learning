"use strict";
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    subCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCourse",
        required: false,
      },
    ],
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
