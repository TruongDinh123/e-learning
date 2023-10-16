"use strict";
const { mongoose } = require("mongoose");

const centerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  packages: [
    {
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
});

const Center = mongoose.model("Center", centerSchema);

module.exports = Center;
