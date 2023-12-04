"use strict";

const User = require("../models/user.model");
const nodemailer = require("nodemailer");

const findByEmail = async ({
  email,
  select = {
    email: 1,
    password: 1,
    lastName: 1,
    roles: 1,
    status: 1,
  },
}) => {
  return await User.findOne({ email }).select(select).lean();
};

const findUserById = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
};

const sendEmail = async ({ to, subject, text }) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "kimochi2033@gmail.com",
      pass: "fmthngflsjewmpyl",
    },
  });

  let mailOptions = {
    from: "kimochi2033@gmail.com",
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = {
  findByEmail,
  sendEmail,
  findUserById,
};
