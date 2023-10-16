"use strict";

const express = require("express");
const { permission, asyncHandler } = require("../../auth/checkAuthen");
const quizController = require("../../controllers/quiz.controller");
const router = express.Router();

router.post(
  "/e-learning/lesson/:lessonId/quiz",
  permission("Trainee"),
  asyncHandler(quizController.createQuiz)
);

router.put(
  "/e-learning/quiz/:quizId",
  permission("Trainee"),
  asyncHandler(quizController.updateQuiz)
);

router.delete(
  "/e-learning/quiz/:quizId/question/:questionId",
  permission("Trainee"),
  asyncHandler(quizController.deleteQuestion)
);

router.post(
  "/e-learning/quiz/:quizId/submit",
  permission("Trainee"),
  asyncHandler(quizController.submitQuiz)
);

module.exports = router;
