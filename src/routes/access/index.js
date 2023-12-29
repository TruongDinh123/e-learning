"use strict";

const express = require("express");
const accessController = require("../../controllers/access.controller");
const { permission, asyncHandler, apiKey } = require("../../auth/checkAuthen");
const { authentication } = require("../../auth/authUtils");
const router = express.Router();

//signUp
router.post("/e-learning/signup", asyncHandler(accessController.signUp));

router.post("/e-learning/login", apiKey, asyncHandler(accessController.login));

//authentication//
router.use(authentication);

router.put(
  "/e-learning/user/update-user-role",
  permission(["Admin", "Mentor"]),
  asyncHandler(accessController.updateUserRoles)
);

router.post(
  "/e-learning/change-password",
  permission(["Admin", "Mentor", "Trainee"]),
  asyncHandler(accessController.changePassword)
);

router.get(
  "/e-learning/users",
  permission(["Admin", "Mentor"]),
  asyncHandler(accessController.getAllUser)
);

router.get(
  "/e-learning/user/:id",
  permission(["Admin", "Mentor", "Trainee"]),
  asyncHandler(accessController.getAUser)
);

router.delete(
  "/e-learning/user/:id",
  permission(["Admin", "Mentor"]),
  asyncHandler(accessController.deleteUser)
);

router.put(
  "/e-learning/update-user/:id",
  permission(["Admin", "Mentor", "Trainee"]),
  asyncHandler(accessController.updateUser)
);

router.post("/e-learning/logout", asyncHandler(accessController.logOut));

module.exports = router;
