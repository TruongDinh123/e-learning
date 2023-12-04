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
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
  },
  timeLimit: {
    type: Number,
    required: false,
  },
  score: {
    type: Number,
    required: true,
  },
  answers: {
    type: Array,
    required: true,
  },
  isComplete: {
    type: Boolean,
    required: false,
  }
}, {
  timestamps: true,
});

const Score = mongoose.model("Score", scoreSchema);

module.exports = Score;
