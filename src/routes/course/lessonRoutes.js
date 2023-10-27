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
  permission(["Mentor", "Admin"]),
  asyncHandler(lessonController.createLesson)
);

router.delete(
  "/e-learning/lesson/:courseId/:lessonId",
  permission(["Mentor", "Admin"]),
  asyncHandler(lessonController.deleteALesson)
);

router.get(
  "/e-learning/lessons/:courseId",
  permission(["Mentor", "Admin"]),
  asyncHandler(lessonController.getAllCourseLeesion)
);

router.get(
  "/e-learning/lesson/:lessonId",
  permission(["Mentor", "Admin"]),
  asyncHandler(lessonController.getALession)
);

//video-lessons

router.post(
  "/e-learning/lesson/:lessonId/upload-video",
  permission(["Mentor", "Admin"]),
  uploadMiddleware.single("filename"),
  asyncHandler(VideoLessonController.createVdLesson)
);

router.delete(
  "/e-learning/lesson/:lessonId/video/:videoLessonId",
  permission(["Mentor", "Admin"]),
  asyncHandler(VideoLessonController.deleteVdLesson)
);

module.exports = router;
