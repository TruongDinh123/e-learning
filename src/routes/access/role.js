"use strict";

const express = require("express");
const { permission, asyncHandler } = require("../../auth/checkAuthen");
const { authentication } = require("../../auth/authUtils");
const roleController = require("../../controllers/role.controller");
const router = express.Router();

router.use(authentication);

router.post(
  "/e-learning/role",
  permission(["Admin", "Mentor"]),
  asyncHandler(roleController.CreateRole)
);

router.put(
  "/e-learning/role/:id",
  permission(["Admin", "Mentor"]),
  asyncHandler(roleController.updateRole)
);

router.delete(
  "/e-learning/role/:id/",
  permission(["Admin", "Mentor"]),
  asyncHandler(roleController.deleteRole)
);

router.get(
  "/e-learning/role",
  permission(["Admin", "Mentor"]),
  asyncHandler(roleController.getRoles)
);

module.exports = router;
