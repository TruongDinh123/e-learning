'use strict';
const mongoose = require('mongoose');

const VideoLessonSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
  },
});

module.exports = mongoose.model('VideoLesson', VideoLessonSchema);
