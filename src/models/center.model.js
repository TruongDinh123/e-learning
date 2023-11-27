"use strict";
const mongoose = require("mongoose");

const centerSchema = new mongoose.Schema(
  {
    nameCenter: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    createdTeachers: {
      type: Number,
      default: 0,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
    },
    account: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Center", centerSchema);
