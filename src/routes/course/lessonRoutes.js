"use strict";

const express = require("express");
const { permission, asyncHandler, apiKey } = require("../../auth/checkAuthen");
const lessonController = require("../../controllers/lesson.controller");
const VideoLessonController = require("../../controllers/video-lesson.controller");
const { uploadMiddleware } = require("../../middlewares/upload");
const { authentication } = require("../../auth/authUtils");
const router = express.Router();

router.use(apiKey);
router.use(authentication);

//lesson
router.post(
  "/e-learning/lesson/:courseId",
  permission(["Mentor", "Admin"]),
  asyncHandler(lessonController.createLesson)
);

router.get(
  "/e-learning/lessons/:courseId",
  permission(["Mentor", "Admin", "Trainee"]),
  asyncHandler(lessonController.getAllCourseLeesons)
);

router.delete(
  "/e-learning/lesson/:courseId/:lessonId",
  permission(["Mentor", "Admin"]),
  asyncHandler(lessonController.deleteALesson)
);

router.put(
  "/e-learning/lesson/:lessonId",
  permission(["Mentor", "Admin"]),
  asyncHandler(lessonController.updateLesson)
);

router.put(
  "/e-learning/complete-lesson/:lessonId",
  permission(["Mentor", "Admin", "Trainee"]),
  asyncHandler(lessonController.completeLesson)
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
