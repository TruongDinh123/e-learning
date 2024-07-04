"use strict";
const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
    },
    startTime: {
      type: Date,
      required: false,
    },
    submitTime: {
      type: Date,
      required: false,
    },
    score: {
      type: Number,
      required: false,
    },
    scoreCustom: {
      type: Number,
      required: false,
    },
    answers: {
      type: Array,
      required: false,
    },
    essayAnswer: {
      type: String,
      required: false,
    },
    filename: {
      type: String,
      required: false,
    },
    isComplete: {
      type: Boolean,
      default: false,
      required: false,
    },
    orderNum: {
      type: Number,
      required: false,
    },
    predictAmount: {
      type: Number,
      required: false,
    },
    predictAmountMaxScore: {
      type: Number,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

const Score = mongoose.model("Score", scoreSchema);

module.exports = Score;
