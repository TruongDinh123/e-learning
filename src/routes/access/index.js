"use strict";

const express = require("express");
const accessController = require("../../controllers/access.controller");
const { permission, asyncHandler, apiKey } = require("../../auth/checkAuthen");
const { authentication } = require("../../auth/authUtils");
const { uploadMiddleware } = require("../../middlewares/upload");
const lessonController = require("../../controllers/lesson.controller");
const categoryController = require("../../controllers/category.controller");
const courseController = require("../../controllers/course.controller");
const quizController = require("../../controllers/quiz.controller");
const router = express.Router();

//signUp
router.post("/e-learning/signup", asyncHandler(accessController.signUp));

//Các API không yêu cầu xác thực

router.get(
    "/e-learning/course/:courseId/quizzeLatesSubmissionTime",
    permission([]),
    asyncHandler(quizController.getSubmissionTimeLatestQuizByCourseId)
);

router.get(
    "/e-learning/get-info-course/:id",
    // permission(["Super-Admin", "Mentor", "Admin", "Trainee"]),
    asyncHandler(courseController.getACourseByInfo)
);

router.get(
  "/e-learning/lessons/:courseId",
  asyncHandler(lessonController.getAllCourseLeesonForStudents)
);

router.get(
  "/e-learning/lesson/:lessonId",
  asyncHandler(lessonController.getALession)
);

router.get(
  "/e-learning/get-all-categories",
  asyncHandler(categoryController.getAllCategoryAndSubCourses)
);

router.get(
  "/e-learning/course/:id",
  asyncHandler(courseController.getACourse)
);

router.get(
  "/e-learning/public-course",
  asyncHandler(courseController.getCoursePublic)
);

/////////
router.use(apiKey);

router.post("/e-learning/login", asyncHandler(accessController.login));

router.post(
  "/e-learning/forgot-password",
  asyncHandler(accessController.forgotPassword)
);

//authentication//
router.use(authentication);

router.put(
  "/e-learning/user/update-user-role",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(accessController.updateUserRoles)
);

router.post(
  "/e-learning/user/:userId/upload-image",
  permission(["Super-Admin", "Mentor", "Admin", "Trainee"]),
  uploadMiddleware.single("filename"),
  asyncHandler(accessController.uploadImageUser)
);

router.post(
  "/e-learning/change-password",
  permission(["Super-Admin", "Admin", "Mentor", "Trainee"]),
  asyncHandler(accessController.changePassword)
);

router.get(
  "/e-learning/users",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(accessController.getAllUser)
);

router.get(
  "/e-learning/user/:id",
  permission(["Super-Admin", "Admin", "Mentor", "Trainee"]),
  asyncHandler(accessController.getAUser)
);

router.delete(
  "/e-learning/user/:id",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(accessController.deleteUser)
);

router.put(
  "/e-learning/update-user/:id",
  permission(["Super-Admin", "Admin", "Mentor", "Trainee"]),
  asyncHandler(accessController.updateUser)
);

router.post("/e-learning/logout", asyncHandler(accessController.logOut));

router.post("/e-learning/handleRefreshToken", asyncHandler(accessController.handlerRefreshToken));

module.exports = router;
