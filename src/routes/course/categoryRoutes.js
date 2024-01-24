"use strict";
const express = require("express");
const { permission, asyncHandler, apiKey } = require("../../auth/checkAuthen");
const categoryController = require("../../controllers/category.controller");
const { authentication } = require("../../auth/authUtils");
const router = express.Router();

router.use(apiKey);
router.use(authentication);

router.get(
  "/e-learning/get-all-categories/:categoryId",
  permission(["Super-Admin", "Mentor", "Admin", "Trainee"]),
  asyncHandler(categoryController.getAllCategoryAndSubCoursesById)
);

router.post(
  "/e-learning/create-category",
  permission(["Super-Admin", "Mentor", "Admin"]),
  asyncHandler(categoryController.createCategoryAndSubCourse)
);

router.delete(
  "/e-learning/delete-category/:categoryId",
  permission(["Super-Admin", "Mentor", "Admin"]),
  asyncHandler(categoryController.deleteCategory)
);

router.put(
  "/e-learning/update-category/:categoryId",
  permission(["Super-Admin", "Mentor", "Admin"]),
  asyncHandler(categoryController.updateCategory)
);

router.get(
  "/e-learning/get-all-subcourses/:subCourseId",
  permission(["Super-Admin", "Mentor", "Admin", "Trainee"]),
  asyncHandler(categoryController.getAllSubCoursesById)
);

router.get(
  "/e-learning/get-all-subcourses",
  permission(["Super-Admin", "Mentor", "Admin", "Trainee"]),
  asyncHandler(categoryController.getAllSubCourses)
);

module.exports = router;
