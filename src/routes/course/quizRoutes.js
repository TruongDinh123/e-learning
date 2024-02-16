"use strict";

const express = require("express");
const { permission, asyncHandler, apiKey } = require("../../auth/checkAuthen");
const quizController = require("../../controllers/quiz.controller");
const { uploadMiddleware } = require("../../middlewares/upload");
const { authentication } = require("../../auth/authUtils");
const router = express.Router();

router.use(apiKey);
router.use(authentication);

router.post(
  "/e-learning/quiz",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(quizController.createQuiz)
);

router.post(
  "/e-learning/quiz/:quizId/start",
  permission(["Super-Admin", "Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.startQuiz)
);

router.get(
  "/e-learning/quizs",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(quizController.getQuizs)
);

router.get(
  "/e-learning/quiz/templates",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(quizController.getAllQuizTemplates)
);

router.post(
  "/e-learning/quiz/:quizId/upload-file",
  permission(["Super-Admin", "Mentor", "Admin"]),
  uploadMiddleware.single("filename"),
  asyncHandler(quizController.uploadFileQuiz)
);

router.get(
  "/e-learning/course/:courseIds/quizzes",
  permission(["Super-Admin", "Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.getQuizsByCourse)
);

router.get(
  "/e-learning/course/:courseIds/info-quizz",
  permission(["Super-Admin", "Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.getQuizsInfoByCourse)
);

router.get(
  "/e-learning/course/:courseId/list-quizzes",
  permission(["Super-Admin", "Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.getQuizzesByStudentAndCourse)
);

router.get(
  "/e-learning/quiz/:quizId",
  permission(["Super-Admin", "Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.getAQuizByCourse)
);

router.get(
  "/e-learning/quiz-template/:quizTemplateId",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(quizController.getAQuizTemplate)
);

router.put(
  "/e-learning/quiz/:quizId",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(quizController.updateQuiz)
);

router.delete(
  "/e-learning/quiz/:quizId/question/:questionId",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(quizController.deleteQuestion)
);

router.delete(
  "/e-learning/quiz/:quizId",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(quizController.deleteQuiz)
);

router.post(
  "/e-learning/quiz/:quizId/submit",
  permission(["Super-Admin", "Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.submitQuiz)
);

router.post(
  "/e-learning/quiz/:quizId/submit-essay",
  permission(["Super-Admin", "Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.submitQuizEssay)
);

router.get(
  "/e-learning/score",
  permission(["Super-Admin", "Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.getScoreByUser)
);

router.get(
  "/e-learning/info-score",
  permission(["Super-Admin", "Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.getScoreByInfo)
);


router.get(
  "/e-learning/:quizId/:userId/score",
  permission(["Super-Admin", "Admin", "Mentor", "Trainee"]),
  asyncHandler(quizController.getScoreByUserId)
);

router.get(
  "/e-learning/quiz/:quizId/all-score",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(quizController.getScoreByQuizId)
);

router.put(
  "/e-learning/score/update",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(quizController.updateScore)
);

router.post(
  "/e-learning/quiz/:quizId/upload-file-user",
  permission(["Super-Admin", "Trainee"]),
  uploadMiddleware.single("filename"),
  asyncHandler(quizController.uploadFileUserSubmit)
);

router.post(
  "/e-learning/quiz/upload-image-question",
  permission(["Super-Admin", "Admin", "Mentor"]),
  uploadMiddleware.single("filename"),
  asyncHandler(quizController.uploadQuestionImage)
);

//quiz templates
router.delete(
  "/e-learning/quiz/templates/:quizTemplateId",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(quizController.deleteQuizTemplates)
);

router.put(
  "/e-learning/quiz/templates/:quizTemplateId",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(quizController.updateQuizTemplate)
);

module.exports = router;
