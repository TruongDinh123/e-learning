"use strict";

const express = require("express");
const { permission, asyncHandler } = require("../../auth/checkAuthen");
const lessonController = require("../../controllers/lesson.controller");
const VideoLessonController = require("../../controllers/video-lesson.controller");
const { uploadMiddleware } = require("../../middlewares/upload");
const router = express.Router();

//lesson
router.post(
  "/e-learning/lesson/:courseId",
  permission("Mentor"),
  asyncHandler(lessonController.createLesson)
);

router.delete(
  "/e-learning/lesson/:courseId/:lessonId",
  permission("Mentor"),
  asyncHandler(lessonController.deleteALesson)
);

router.get(
  "/e-learning/lessons/:courseId",
  asyncHandler(lessonController.getAllCourseLeesion)
);

router.get(
  "/e-learning/lesson/:lessonId",
  asyncHandler(lessonController.getALession)
);

//video-lessons

router.post(
  "/e-learning/lesson/:lessonId/upload-video",
  permission("Mentor"),
  uploadMiddleware.single("filename"),
  asyncHandler(VideoLessonController.createVdLesson)
);

router.delete(
  "/e-learning/lesson/:lessonId/video/:videoLessonId",
  permission("Mentor"),
  asyncHandler(VideoLessonController.deleteVdLesson)
);

module.exports = router;
