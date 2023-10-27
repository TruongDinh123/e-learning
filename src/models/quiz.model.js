"use strict";
const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: true,
  },
  questions: [
    {
      question: {
        type: String,
        required: true,
      },
      options: [
        {
          type: String,
          required: true,
        },
      ],
      answer: {
        type: String,
        required: true,
      },
    },
  ],
});

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
