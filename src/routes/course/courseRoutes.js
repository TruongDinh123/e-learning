"use strict";

const express = require("express");
const { permission, asyncHandler } = require("../../auth/checkAuthen");
const courseController = require("../../controllers/course.controller");
const router = express.Router();

//courses
router.post(
  "/e-learning/course",
  permission("Mentor"),
  asyncHandler(courseController.createCourse)
);

router.get(
  "/e-learning/get-courses",
  permission("Mentor"),
  asyncHandler(courseController.getCourses)
);

router.put(
  "/e-learning/course/:id",
  permission("Mentor"),
  asyncHandler(courseController.updateCourse)
);

router.delete(
  "/e-learning/course/:id",
  permission("Mentor"),
  asyncHandler(courseController.deleteCourse)
);


module.exports = router;
