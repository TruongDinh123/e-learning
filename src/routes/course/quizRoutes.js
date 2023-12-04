"use strict";

const express = require("express");
const { permission, asyncHandler } = require("../../auth/checkAuthen");
const quizController = require("../../controllers/quiz.controller");
const { uploadMiddleware } = require("../../middlewares/upload");
const router = express.Router();

router.post(
  "/e-learning/quiz",
  permission(["Admin", "Mentor"]),
  asyncHandler(quizController.createQuiz)
);

router.get(
  "/e-learning/course/:courseIds/quizzes",
  permission(["Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.getQuizsByCourse)
);

router.get(
  "/e-learning/course/:courseId/list-quizzes",
  permission(["Trainee"]),
  asyncHandler(quizController.getQuizzesByStudentAndCourse)
);

router.get(
  "/e-learning/quiz/:quizId",
  permission(["Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.getAQuizByCourse)
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

router.delete(
  "/e-learning/quiz/:quizId",
  permission(["Admin", "Mentor"]),
  asyncHandler(quizController.deleteQuiz)
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
  "/e-learning/:quizId/:userId/score",
  permission(["Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.getScoreByUserId)
);

module.exports = router;
