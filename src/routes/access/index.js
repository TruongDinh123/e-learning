"use strict";

const express = require("express");
const accessController = require("../../controllers/access.controller");
const { permission, asyncHandler, apiKey } = require("../../auth/checkAuthen");
const { authentication } = require("../../auth/authUtils");
const router = express.Router();

//signUp
router.post("/e-learning/signup", asyncHandler(accessController.signUp));

router.post(
  "/e-learning/login",
  apiKey,
  asyncHandler(accessController.login)
);

router.put(
  "/e-learning/user/:userId/:roleId",
  apiKey,
  permission("Admin"),
  asyncHandler(accessController.updateUserRoles)
);

//authentication//
router.use(authentication);
//////////////////

router.post("/e-learning/logout", asyncHandler(accessController.logOut));

module.exports = router;
