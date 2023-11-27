"use strict";

const express = require("express");
const { apiKey } = require("../auth/checkAuthen");
const router = express.Router();

//check apiKey
router.use(apiKey);

router.use("/v1/api", require("./access"));
router.use("/v1/api", require("./access/role"));
router.use("/v1/api", require("./course/courseRoutes"));
router.use("/v1/api", require("./course/lessonRoutes"));
router.use("/v1/api", require("./course/quizRoutes"));
router.use("/v1/api", require("./package/packageRoutes"));
router.use("/v1/api", require("./course/assignmentRoutes"));

module.exports = router;
