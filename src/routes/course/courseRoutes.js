"use strict";

const express = require("express");
const { permission, asyncHandler } = require("../../auth/checkAuthen");
const courseController = require("../../controllers/course.controller");
const router = express.Router();

//courses
router.post(
  "/e-learning/course",
  permission(["Mentor", "Admin"]),
  asyncHandler(courseController.createCourse)
);

router.get(
  "/e-learning/get-courses",
  permission(["Mentor", "Admin", "Trainee"]),
  asyncHandler(courseController.getCourses)
);

router.get(
  "/e-learning/course/:id",
  permission(["Mentor", "Admin", "Trainee"]),
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

router.delete(
  "/e-learning/delete-user-course/user/:userId/course/:courseId",
  permission(["Mentor", "Admin"]),
  asyncHandler(courseController.removeStudentFromCourse)
);

router.get(
  "/e-learning/get-student-course",
  permission(["Trainee"]),
  asyncHandler(courseController.getstudentCourses)
)

router.get(
  "/e-learning/get-complete-course/:courseId",
  permission(["Mentor", "Admin", "Trainee"]),
  asyncHandler(courseController.getCourseCompletion)
)

router.post(
  "/e-learning/public-course/:courseId",
  permission(["Mentor", "Admin"]),
  asyncHandler(courseController.buttonShowCourse)
)

router.post(
  "/e-learning/priavte-course/:courseId",
  permission(["Mentor", "Admin"]),
  asyncHandler(courseController.buttonPrivateCourse)
)

router.get(
  "/e-learning/public-course",
  permission(["Mentor", "Admin", "Trainee"]),
  asyncHandler(courseController.getCoursePublic)
)


module.exports = router;
