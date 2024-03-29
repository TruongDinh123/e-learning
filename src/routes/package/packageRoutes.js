"use strict";

const express = require("express");
const { permission, asyncHandler } = require("../../auth/checkAuthen");
const PackageController = require("../../controllers/package.controller");
const centerController = require("../../controllers/center.controller");
const router = express.Router();

router.post(
  "/e-learning/package",
  permission(["Super-Admin", "Admin", "Mentor"]),
  asyncHandler(PackageController.createPackage)
);

router.post(
  "/e-learning/centers/purchase",
  permission(["Super-Admin", "Admin", "Mentor", "Trainee"]),
  asyncHandler(centerController.purchasePackage)
);

router.post(
  "/e-learning/create-teacher/center",
  permission(["Super-Admin", "Admin", "Center"]),
  asyncHandler(centerController.createTeacherCenter)
);

module.exports = router;
