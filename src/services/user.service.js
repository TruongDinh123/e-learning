"use strict";

const User = require("../models/user.model");
const nodemailer = require("nodemailer");

const findByEmail = async ({
  email,
  select = {
    email: 1,
    password: 1,
    lastName: 1,
    firstName: 1,
    image_url: 1,
    roles: 1,
    status: 1,
    courses: 1,
  },
}) => {
  return await User.findOne({ email })
    .select(select)
    .populate("roles", "_id name")
    .populate("courses", "_id name")
    .lean();
};

const findUserById = async (userId) => {
  try {
    const user = await User.findById(userId).populate("roles").lean();
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
      user: "247learn.vn@gmail.com",
      pass: "glpiggogzyxtfhod",
    },
  });

  let mailOptions = {
    from: "247learn.vn@gmail.com",
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

const createResponseObject = async (user) =>  {
  return {
    message: "Student added to course successfully!",
    status: 200,
    metadata: {
      firstName: user.firstName,
      email: user.email,
      courses: user.courses.map(course => course.toString()), // Chỉ trả về ID của khóa học
      quizzes: user.quizzes.map(quiz => quiz.toString()), // Chỉ trả về ID của quiz
      roles: user.roles.map(role => role.toString()), // Chỉ trả về ID của vai trò
      status: user.status
    }
  };
}

module.exports = {
  findByEmail,
  sendEmail,
  findUserById,
  createResponseObject
};
