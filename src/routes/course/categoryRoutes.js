"use strict";
const express = require("express");
const { permission, asyncHandler } = require("../../auth/checkAuthen");
const categoryController = require("../../controllers/category.controller");
const router = express.Router();

router.post(
  "/e-learning/create-category",
  permission(["Mentor", "Admin"]),
  asyncHandler(categoryController.createCategoryAndSubCourse)
);

router.get(
  "/e-learning/get-all-categories/:categoryId",
  permission(["Mentor", "Admin", "Trainee"]),
  asyncHandler(categoryController.getAllCategoryAndSubCoursesById)
);

router.delete(
  "/e-learning/delete-category/:categoryId",
  permission(["Mentor", "Admin"]),
  asyncHandler(categoryController.deleteCategory)
);

router.put(
  "/e-learning/update-category/:categoryId",
  permission(["Mentor", "Admin"]),
  asyncHandler(categoryController.updateCategory)
);

router.get(
  "/e-learning/get-all-categories",
  permission(["Mentor", "Admin", "Trainee"]),
  asyncHandler(categoryController.getAllCategoryAndSubCourses)
);

router.get(
  "/e-learning/get-all-subcourses/:subCourseId",
  permission(["Mentor", "Admin", "Trainee"]),
  asyncHandler(categoryController.getAllSubCoursesById)
);

router.get(
  "/e-learning/get-all-subcourses",
  permission(["Mentor", "Admin", "Trainee"]),
  asyncHandler(categoryController.getAllSubCourses)
);

module.exports = router;
