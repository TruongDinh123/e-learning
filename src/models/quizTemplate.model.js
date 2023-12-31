"use strict";
const mongoose = require("mongoose");

const quizTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["essay", "multiple_choice"],
      required: true,
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
      filename: {
        type: String,
        required: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

const QuizTemplate = mongoose.model("QuizTemplate", quizTemplateSchema);

module.exports = QuizTemplate;


