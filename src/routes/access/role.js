"use strict";

const express = require("express");
const { permission, asyncHandler, apiKey } = require("../../auth/checkAuthen");
const { authentication } = require("../../auth/authUtils");
const roleController = require("../../controllers/role.controller");
const router = express.Router();

router.use(apiKey);
router.use(authentication);

router.post(
  "/e-learning/role",
  permission(["Super-Admin", "Admin"]),
  asyncHandler(roleController.CreateRole)
);

router.put(
  "/e-learning/role/:id",
  permission(["Super-Admin", "Admin"]),
  asyncHandler(roleController.updateRole)
);

router.delete(
  "/e-learning/role/:id/",
  permission(["Super-Admin", "Admin"]),
  asyncHandler(roleController.deleteRole)
);

router.get(
  "/e-learning/role",
  permission(["Super-Admin", "Admin"]),
  asyncHandler(roleController.getRoles)
);

module.exports = router;
