const express = require("express");
const { checkOverload } = require("./helpers/check.connect");
const app = express();
const PORT = process.env.PORT || 5000;
const dotenv = require("dotenv").config();

//init middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//intit db
require("./dbs/dbConnect");
// checkOverload();
//init routes
app.use("", require("./routes"));

//handling error
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  return res.status(statusCode).json({
    status: "error",
    code: statusCode,
    message: error.message || "Internal Server Error",
  });
});

module.exports = app;
