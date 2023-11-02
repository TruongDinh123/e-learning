"use strict";

const express = require("express");
const { permission, asyncHandler } = require("../../auth/checkAuthen");
const quizController = require("../../controllers/quiz.controller");
const router = express.Router();

router.post(
  "/e-learning/lesson/:lessonId/quiz",
  permission(["Admin", "Mentor"]),
  asyncHandler(quizController.createQuiz)
);

router.get(
  "/e-learning/lesson/:lessonId/quizs",
  permission(["Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.getQuizsByLesson)
);

router.put(
  "/e-learning/quiz/:quizId",
  permission(["Admin", "Mentor"]),
  asyncHandler(quizController.updateQuiz)
);

router.delete(
  "/e-learning/quiz/:quizId/question/:questionId",
  permission(["Admin", "Mentor"]),
  asyncHandler(quizController.deleteQuestion)
);

router.post(
  "/e-learning/quiz/:quizId/submit",
  permission(["Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.submitQuiz)
);

router.get(
  "/e-learning/score",
  permission(["Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.getScoreByUser)
);

router.get(
  "/e-learning/:userId/score",
  permission(["Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.getScoreByUserId)
);

module.exports = router;
