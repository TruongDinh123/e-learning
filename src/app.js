import express from "express";
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require("cors");

//init middleware
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: ["http://localhost:3000"],
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
  const statusCode = error.status || 500;
  return res.status(statusCode).json({
    status: "error",
    code: statusCode,
    message: error.message || "Internal Server Error",
  });
});

module.exports = app;
