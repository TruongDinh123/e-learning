"use strict";
const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  answers: {
    type: Array,
    required: true,
  },
});

const Score = mongoose.model("Score", scoreSchema);


module.exports = Score;
