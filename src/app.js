const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");

//init middleware
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

dotenv.config();

app.use(
  cors({
    // origin: [process.env.CLIENT_URL],
    origin: "https://e-learning-fe.onrender.com",
    // origin: "https://116.118.51.237:3000",
    // origin: "https://www.247learn.vn",
    credentials: true,
    methods: "GET,POST,PUT,DELETE",
  })
);

app.use("/uploads", express.static("uploads"));

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
  const statusCode = typeof error.status === "number" ? error.status : 500;
  return res.status(statusCode).json({
    status: "error",
    code: statusCode,
    message: error.message || "Internal Server Error",
  });
});

module.exports = app;
