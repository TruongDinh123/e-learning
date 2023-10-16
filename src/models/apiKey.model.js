"use strict";

const mongoose = require("mongoose");

var apiKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("ApiKey", apiKeySchema);
