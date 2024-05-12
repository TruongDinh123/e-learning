"use strict";

const { NotFoundError } = require("../core/error.response");
const userModel = require("../models/user.model");
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
    quizCount: 1,
    quizLimit: 1,
  },
}) => {
  return await User.findOne({ email })
    .select(select)
    .populate("roles", "_id name")
    .populate("courses", "_id name teacherQuizzes")
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

const createResponseObject = async (user) => {
  return {
    message: "Student added to course successfully!",
    status: 200,
    metadata: {
      firstName: user.firstName,
      email: user.email,
      courses: user.courses.map((course) => course.toString()), // Chỉ trả về ID của khóa học
      quizzes: user.quizzes.map((quiz) => quiz.toString()), // Chỉ trả về ID của quiz
      roles: user.roles.map((role) => role.toString()), // Chỉ trả về ID của vai trò
      status: user.status,
    },
  };
};

  // Hàm gửi email được tách ra để dễ quản lý và tái sử dụng
  const sendEmailToStudent = async (studentId, courses, lessons, submissionTime, lessonId) => {
    const student = await userModel.findById(studentId).lean();
    if (!student) throw new NotFoundError("student not found");

    // Tìm thông tin khóa học và giáo viên từ dữ liệu đã truy vấn trước đó
    const course = courses.find((c) =>
      c.students.map((id) => id.toString()).includes(studentId.toString())
    );
    const lesson = lessons?.find((l) => l._id.toString() === lessonId);
    const teacherName =
      course && course.teacher
        ? [course.teacher.lastName, course.teacher.firstName]
            .filter(Boolean)
            .join(" ") || "Giáo viên"
        : "Giáo viên";
    const lessonName = lesson ? lesson.name : undefined;

    if (!course) throw new NotFoundError("course not found");

    const formattedSubmissionTime = submissionTime
      ? new Date(submissionTime).toLocaleString("vi-VN", {
          hour12: false,
          timeZone: "Asia/Ho_Chi_Minh",
        })
      : "Không có thời hạn";

    const mailOptions = {
      from: "247learn.vn@gmail.com",
      to: student.email,
      subject: "Bạn có một bài tập mới",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Chào mừng đến với 247learn.vn</title>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { width: 600px; margin: auto; }
                .header { background-color: #002C6A; color: white; padding: 10px; text-align: center; }
                .content { padding: 20px; }
                .footer { background-color: #f2f2f2; padding: 10px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Chào mừng đến với <a href="https://www.247learn.vn" style="color: white; text-decoration: none;">247learn.vn</a></h1>
                </div>
                <div class="content">
                    <p>Xin chào,</p>
                    <p>Giáo viên <strong>${teacherName}</strong> đã giao cho bạn một bài tập mới trong <strong>${course.name}</strong></p>
                    ${lessonName ? `<p>Thuộc bài học: <strong>${lessonName}</strong></p>` : ""}
                    <ul>
                        <li>Thời hạn nộp bài: <strong>${formattedSubmissionTime}</strong></li>
                    </ul>
                    <p>Vui lòng nộp bài đúng hạn.</p>
                    <p>Nếu có bất kỳ thắc mắc nào, xin đừng ngần ngại liên hệ với chúng tôi qua <a href="mailto: 247learn.vn@gmail.com">247learn.vn@gmail.com</a>.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 <a href="https://www.247learn.vn" style="color: inherit; text-decoration: none;">247learn.vn</a>. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "247learn.vn@gmail.com",
        pass: "glpiggogzyxtfhod",
      },
    });

    return transporter.sendMail(mailOptions);
  }

  const generatePassword = () => {
    const length = 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  };

  const getTestCount = async (userId) => {
    const user = await userModel.findById(userId).lean();

    return {
      testCount: user.testCount || 0
    };
  }

module.exports = {
  findByEmail,
  sendEmail,
  findUserById,
  createResponseObject,
  sendEmailToStudent,
  generatePassword,
  getTestCount
};
