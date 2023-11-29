"use strict";

const express = require("express");
const { permission, asyncHandler } = require("../../auth/checkAuthen");
const assignmentController = require("../../controllers/assignment.controller");
const router = express.Router();

router.post(
  "/e-learning/assignment",
  permission(["Admin", "Mentor"]),
  asyncHandler(assignmentController.createAssignment)
);
router.get(
  "/e-learning/course/:courseId/assignment",
  permission(["Admin", "Mentor", "Trainee"]),
  asyncHandler(assignmentController.getAssignmentByCourseId)
);
router.get(
  "/e-learning/assignment/:id",
  permission(["Admin", "Mentor"]),
  asyncHandler(assignmentController.getAAssignment)
);

router.post(
  "/e-learning/assignment/:assignmentId/submit",
  permission(["Admin", "Mentor", "Trainee"]),
  asyncHandler(assignmentController.submitAssignment)
);

router.put(
  "/e-learning/assignment/:assignmentId",
  permission(["Admin", "Mentor"]),
  asyncHandler(assignmentController.updateQuiz)
);

router.delete(
  "/e-learning/assignment/:assignmentId",
  permission(["Admin", "Mentor"]),
  asyncHandler(assignmentController.deleteAssignment)
);

router.delete(
  "/e-learning/assignment/:assignmentId/question/:questionId",
  permission(["Admin", "Mentor"]),
  asyncHandler(assignmentController.deleteQuestionAssignment)
);

module.exports = router;
