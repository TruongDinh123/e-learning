"use strict";
const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ['essay', 'multiple_choice'],
      required: true,
    },
    
    courseIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false,
    }],

    studentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    }],

    submissionTime: {
      type: Date,
      required: false,
    },

    questions: [
      {
        question: {
          type: String,
          required: false,
        },
        options: [
          {
            type: String,
            required: false,
          },
        ],
        answer: {
          type: String,
          required: false,
        },
      },
    ],

    essay: {
      title: {
        type: String,
        required: false,
      },
      content: {
        type: String,
        required: false,
      },
      attachment: {
        type: String,
        required: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
