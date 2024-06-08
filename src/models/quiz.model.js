'use strict';
const mongoose = require('mongoose');

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

    courseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: false,
      },
    ],

    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: false,
    },

    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
    ],

    usersTested: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
    ],

    quizTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuizTemplate',
      required: false,
    },

    submissionTime: {
      type: Date,
      required: false,
    },

    timeLimit: {
      type: Number,
      required: false,
    },

    questions: [
      {
        question: {
          type: String,
          required: false,
        },

        filename: {
          type: String,
          required: false,
        },

        image_url: {
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

    isDraft: {type: Boolean, default: false, index: true, select: true},

    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },

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
    activePresent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
