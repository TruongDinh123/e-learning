"use strict";

const express = require("express");
const { permission, asyncHandler, apiKey } = require("../../auth/checkAuthen");
const courseController = require("../../controllers/course.controller");
const { uploadMiddleware } = require("../../middlewares/upload");
const { authentication } = require("../../auth/authUtils");
const router = express.Router();

router.use(apiKey);
router.use(authentication);

//courses
router.post(
  "/e-learning/course",
  permission(["Super-Admin", "Admin"]),
  asyncHandler(courseController.createCourse)
);

router.post(
  "/e-learning/course/:courseId/upload-image",
  permission(["Super-Admin", "Mentor", "Admin"]),
  uploadMiddleware.single("filename"),
  asyncHandler(courseController.uploadImageCourse)
);

router.get(
  "/e-learning/get-courses",
  permission(["Super-Admin", "Mentor", "Admin", "Trainee"]),
  asyncHandler(courseController.getCourses)
);

router.get(
  "/e-learning/course/:id",
  permission(["Super-Admin", "Mentor", "Admin", "Trainee"]),
  asyncHandler(courseController.getACourse)
);

router.put(
  "/e-learning/update-course/:id",
  permission(["Mentor", "Admin"]),
  asyncHandler(courseController.updateCourse)
);

router.delete(
  "/e-learning/course/:id",
  permission(["Mentor", "Admin"]),
  asyncHandler(courseController.deleteCourse)
);

router.post(
  "/e-learning/invite-user-course/:courseId",
  permission(["Mentor", "Admin"]),
  asyncHandler(courseController.addStudentToCourse)
);

router.post(
  "/e-learning/invite-teacher-course/:courseId",
  permission(["Admin"]),
  asyncHandler(courseController.addTeacherToCourse)
);

router.put(
  "/e-learning/update-teacher-course/:courseId",
  permission(["Admin"]),
  asyncHandler(courseController.updateCourseTeacher)
);

router.delete(
  "/e-learning/delete-user-course/user/:userId/course/:courseId",
  permission(["Mentor", "Admin"]),
  asyncHandler(courseController.removeStudentFromCourse)
);

router.get(
  "/e-learning/get-student-course",
  permission(["Trainee", "Mentor", "Admin"]),
  asyncHandler(courseController.getstudentCourses)
);

router.get(
  "/e-learning/get-complete-course/:courseId",
  permission(["Mentor", "Admin", "Trainee"]),
  asyncHandler(courseController.getCourseCompletion)
);

router.post(
  "/e-learning/public-course/:courseId",
  permission(["Mentor", "Admin"]),
  asyncHandler(courseController.buttonShowCourse)
);

router.post(
  "/e-learning/priavte-course/:courseId",
  permission(["Mentor", "Admin"]),
  asyncHandler(courseController.buttonPrivateCourse)
);

router.post(
  "/e-learning/course/:courseId/notifications",
  permission(["Mentor", "Admin"]),
  asyncHandler(courseController.createNotification)
);

module.exports = router;
