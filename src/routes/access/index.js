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

router.get(
  "/e-learning/users",
  permission(["Admin", "Mentor"]),
  asyncHandler(accessController.getAllUser)
);

router.delete(
  "/e-learning/user/:id",
  permission(["Admin", "Mentor"]),
  asyncHandler(accessController.deleteUser)
);

router.post("/e-learning/logout", asyncHandler(accessController.logOut));

router.post(
  "/e-learning/refreshToken",
  asyncHandler(accessController.handlerRefreshToken)
);

module.exports = router;
