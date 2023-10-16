"use strict";

const express = require("express");
const { permission, asyncHandler } = require("../../auth/checkAuthen");
const lessonController = require("../../controllers/lesson.controller");
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

module.exports = router;
