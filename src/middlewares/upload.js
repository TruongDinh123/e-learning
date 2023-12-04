"use strict";

const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const storage = multer.diskStorage({
    filename: (req, file, cb) => {
      const uniqueFilename = `${uuidv4()}-${file.originalname}`;
      cb(null, uniqueFilename);
    },
});

const uploadMiddleware = multer({ storage: storage });

module.exports = {
  uploadMiddleware
};

