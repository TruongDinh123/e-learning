'use strict'
const { mongoose } = require("mongoose");

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});
const Package = mongoose.model("Package", packageSchema);

exports.Package = Package;