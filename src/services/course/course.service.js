const { NotFoundError, BadRequestError } = require("../../core/error.response");
const courseModel = require("../../models/course.model");
const lessonModel = require("../../models/lesson.model");
const User = require("../../models/user.model");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const userLessonModel = require("../../models/userLesson.model");
const validateMongoDbId = require("../../config/validateMongoDbId");
const { v2: cloudinary } = require("cloudinary");
const categoryModel = require("../../models/category.model");
const { convertToObjectIdMongodb } = require("../../utils");
const Role = require("../../models/role.model");

cloudinary.config({
  cloud_name: "dvsvd87sm",
  api_key: "243392977754277",
  api_secret: "YnSIAsvn7hRPqxTdIQBX9gBzihE",
});

class CourseService {
  static createCourse = async ({ name, title, userId, categoryId }) => {
    try {
      const course = await courseModel.create({
        name,
        title,
        category: categoryId,
      });
      const createCourse = course.save();

      const user = await User.findById(userId);
      if (!user) throw new NotFoundError("User not found");

      user.courses.push(course._id);
      await user.save();

      const category = await categoryModel.findById(categoryId);
      if (!category) throw new NotFoundError("category not found");

      category.courses.push(course._id);
      await category.save();

      return createCourse;
    } catch (error) {
      throw new BadRequestError("Failed to create course", error);
    }
  };

  static uploadImageCourse = async ({ filename, courseId }) => {
    validateMongoDbId(courseId);
    try {
      const findCourse = await courseModel.findById(courseId);
      if (!findCourse) {
        throw new NotFoundError("Course not found");
      }

      if (findCourse.filename && findCourse.image_url) {
        await cloudinary.uploader.destroy(findCourse.filename, {
          resource_type: "image",
        });
      }

      const result = await cloudinary.uploader.upload(filename, {
        resource_type: "image",
      });
      findCourse.filename = result.public_id;
      findCourse.image_url = result.secure_url;

      await findCourse.save();

      return { findCourse };
    } catch (error) {
      throw new BadRequestError(error);
    }
  };

  static getCourse = async () => {
    try {
      const courses = await courseModel
        .find()
        .populate("students", "firstName lastName")
        .populate("lessons");

      if (!courses) throw new NotFoundError("Courses not found");
      return courses;
    } catch (error) {
      throw new BadRequestError("Failed to get a Course", error);
    }
  };

  static getACourse = async ({ id }) => {
    try {
      const aCourse = await courseModel
        .findById({
          _id: id,
        })
        .populate("students", "lastName email roles notifications")
        .populate("teacher")
        .populate("lessons")
        .populate("quizzes");

      return aCourse;
    } catch (error) {
      throw new BadRequestError("Failed to get a Course", error);
    }
  };

  static buttonShowCourse = async (courseId) => {
    try {
      const updatedCourse = await courseModel.findById(courseId);
      if (!updatedCourse) throw new NotFoundError("Course not found");

      if (updatedCourse.showCourse === true)
        throw new BadRequestError("Course is already public");

      updatedCourse.showCourse = true;

      await updatedCourse.save();

      return updatedCourse;
    } catch (error) {
      throw new BadRequestError("Course is failed", error);
    }
  };

  static buttonPrivateCourse = async (courseId) => {
    try {
      const course = await courseModel.findById(courseId);
      if (!course) throw new NotFoundError("Course not found");

      if (course.showCourse === false)
        throw new BadRequestError("Course is already private");

      course.showCourse = false;

      await course.save();
      return course;
    } catch (error) {
      throw new BadRequestError("Course is failed", error);
    }
  };

  static getCoursePublic = async () => {
    const course = await courseModel
      .find({
        showCourse: true,
      })
      .populate("category", "name")
      .populate("teacher", "firstName lastName _id");
    return course;
  };

  static updateCourse = async ({ id, name, title, categoryId }) => {
    try {
      const course = await courseModel.findById(id);

      if (!course) throw new BadRequestError("Course not found");

      // Loại bỏ khóa học khỏi danh mục cũ nếu có
      if (course.category && course.category.toString() !== categoryId) {
        const oldCategory = await categoryModel.findById(course.category);
        if (oldCategory) {
          oldCategory.courses.pull(id);
          await oldCategory.save();
        }
      }

      // Thêm khóa học vào danh mục mới nếu chưa tồn tại
      const findCategory = await categoryModel.findById(categoryId);
      if (findCategory && !findCategory.courses.includes(id)) {
        findCategory.courses.push(id);
        await findCategory.save();
      }

      course.name = name;
      course.title = title;
      course.category = categoryId;

      const updateCourse = await course.save();

      return updateCourse;
    } catch (error) {
      throw new BadRequestError("Failed to update course", error);
    }
  };

  static deleteCourse = async (id) => {
    try {
      await lessonModel.deleteMany({ courseId: id });

      const course = await courseModel.findById(id);
      if (!course) throw new NotFoundError("Course not found");

      if (course.filename) {
        const publicId = course.filename;
        await cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
        });
      }
      // Find the category that contains the course
      const category = await categoryModel.findOne({
        courses: convertToObjectIdMongodb(id),
      });

      if (category) {
        // Remove the course from the category's course list
        category.courses = category.courses.filter((courseId) => {
          return courseId.toString() !== id.toString();
        });
        await category.save();
      }

      await courseModel.findByIdAndDelete(id);
    } catch (error) {
      throw new BadRequestError(error);
    }
  };

  static addStudentToCours = async ({ courseId, email, userId }) => {
    try {
      let user = await User.findOne({ email });

      const course = await courseModel.findById(courseId);
      if (!course) throw new NotFoundError("Khóa học không tồn tại");

      const loggedInUser = await User.findById(userId);

      const teacherName = loggedInUser.firstName;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "247learn.vn@gmail.com",
          pass: "glpiggogzyxtfhod",
        },
      });

      const mailOptions = {
        from: "247learn.vn@gmail.com",
        to: email,
        subject: `Chào mừng bạn đến khóa học ${course.name}`,
        html: "",
      };

      const adminRole = await Role.find({
        $or: [{ name: "Admin" }, { name: "Super-Admin" }],
      }).lean();
      if (!adminRole) {
        throw new NotFoundError("Role 'Admin' not found");
      }

      const adminRoleIds = adminRole.map((role) => role._id.toString());

      if (
        !loggedInUser.roles.some((role) =>
          adminRoleIds.includes(role.toString())
        ) &&
        loggedInUser._id.toString() !== course.teacher.toString()
      ) {
        throw new BadRequestError(
          "Chỉ giáo viên của khóa học hoặc Admin mới có thể thêm người dùng vào khóa học"
        );
      }

      let shouldSendEmail = false;
      if (!user || user.status === "inactive") {
        const password = Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(password, 10);

        const traineeRole = await Role.findOne({ name: "Trainee" });
        if (!traineeRole) {
          throw new NotFoundError("Role 'Trainee' not found");
        }

        if (!user) {
          user = await User.create({
            email,
            firstName: "User" + Math.floor(Math.random() * 10000),
            password: passwordHash,
            roles: [traineeRole._id],
          });
        } else {
          user.password = passwordHash;
          user.status = "active";
          await user.save();
        }

        mailOptions.html = `
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
              <p>Chúng tôi rất vui mừng thông báo rằng bạn đã được đăng ký thành công vào khoá học <strong>${course.name}</strong> do giáo viên <strong>${teacherName}</strong> hướng dẫn.</p>
              <p>Dưới đây là thông tin tài khoản của bạn để truy cập vào hệ thống:</p>
              <ul>
                <li>Tài khoản: <strong>${email}</strong></li>
                <li>Mật khẩu: <strong>${password}</strong></li>
              </ul>
              <p>Vui lòng không chia sẻ thông tin tài khoản của bạn với người khác. Bạn có thể đổi mật khẩu sau khi đăng nhập lần đầu.</p>
              <p>Nếu có bất kỳ thắc mắc nào, xin đừng ngần ngại liên hệ với chúng tôi qua <a href="mailto:support@247learn.vn">support@247learn.vn</a>.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 <a href="https://www.247learn.vn" style="color: inherit; text-decoration: none;">247learn.vn</a>. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
        shouldSendEmail = true;
      } else {
        // Cấu hình nội dung HTML của mailOptions cho người dùng hiện tại
        mailOptions.html = `
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
          <p>Chúng tôi rất vui mừng thông báo rằng bạn đã được thêm vào khoá học <strong>${course.name}</strong> do giáo viên <strong>${teacherName}</strong> hướng dẫn.</p>
          <p>Bạn có thể tiếp tục sử dụng tài khoản hiện tại của mình để truy cập vào khóa học.</p>
          <p>Nếu có bất kỳ thắc mắc nào, xin đừng ngần ngại liên hệ với chúng tôi qua <a href="mailto:support@247learn.vn">support@247learn.vn</a>.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 <a href="https://www.247learn.vn" style="color: inherit; text-decoration: none;">247learn.vn</a>. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
        // Đánh dấu cần gửi email
        shouldSendEmail = true;
      }

      // Gửi email nếu cần
      if (shouldSendEmail) {
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.error("Failed to send email", error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      }

      if (!user.courses.includes(courseId)) {
        user.courses.push(courseId);
        await user.save();
      }

      if (!course.students.includes(user._id)) {
        course.students.push(user._id);
        await course.save();
      }

      return user;
    } catch (error) {
      console.log("🚀 ~ error:", error);
      throw new BadRequestError("Lỗi server");
    }
  };

  static addTeacherToCours = async ({ courseId, email }) => {
    try {
      let user = await User.findOne({ email });

      const traineeRole = await Role.findOne({ name: "Trainee" });
      if (!traineeRole) {
        throw new NotFoundError("Role 'Trainee' not found");
      }

      if (user?.roles?.includes(traineeRole.id)) {
        throw new BadRequestError(
          "Người dùng hiện tại là học viên, bạn hãy chuyển thành giáo viên trước khi thêm vào khóa học"
        );
      }
      const course = await courseModel.findById(courseId);
      if (!course) throw new NotFoundError("Course not found");

      if (course.teacher) {
        throw new BadRequestError("Không thể thêm người dùng này vào khóa học");
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "247learn.vn@gmail.com",
          pass: "glpiggogzyxtfhod",
        },
      });

      const mailOptions = {
        from: "247learn.vn@gmail.com",
        to: email,
        subject: `Chào mừng bạn đến khóa học ${course.name}`,
        html: "",
      };

      let shouldSendEmail = false;

      if (!user || user.status === "inactive") {
        const password = Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(password, 10);

        const mentorRole = await Role.findOne({ name: "Mentor" });
        if (!mentorRole) {
          throw new NotFoundError("Role 'Mentor' not found");
        }

        if (!user) {
          user = await User.create({
            email,
            firstName: "User" + Math.floor(Math.random() * 10000),
            password: passwordHash,
            roles: [mentorRole._id],
          });
        } else {
          user.password = passwordHash;
          user.status = "active";
          await user.save();
        }

        mailOptions.html = `
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
                        <p>Chúng tôi rất vui mừng thông báo rằng bạn đã được đăng ký thành công trở thành giáo viên của khoá học <strong>${course.name}</strong></p>
                        <p>Dưới đây là thông tin tài khoản của bạn để truy cập vào hệ thống:</p>
                        <ul>
                            <li>Tài khoản: <strong>${email}</strong></li>
                            <li>Mật khẩu: <strong>${password}</strong></li>
                        </ul>
                        <p>Vui lòng không chia sẻ thông tin tài khoản của bạn với người khác. Bạn có thể đổi mật khẩu sau khi đăng nhập lần đầu.</p>
                        <p>Nếu có bất kỳ thắc mắc nào, xin đừng ngần ngại liên hệ với chúng tôi qua <a href="mailto:support@247learn.vn">247learn.vn@gmail.com</a>.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 <a href="https://www.247learn.vn" style="color: inherit; text-decoration: none;">247learn.vn</a>. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
          `;
        shouldSendEmail = true;
      } else {
        mailOptions.html = `
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
                        <p>Chúng tôi rất vui mừng thông báo rằng bạn đã được đăng ký thành công trở thành giáo viên của khoá học <strong>${course.name}</strong></p>
                        <p>Bạn hãy đăng nhập vào tài khoản hiện tại của bạn để truy cập vào hệ thống:</p>
                        <p>Nếu có bất kỳ thắc mắc nào, xin đừng ngần ngại liên hệ với chúng tôi qua <a href="mailto:support@247learn.vn">247learn.vn@gmail.com</a>.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 <a href="https://www.247learn.vn" style="color: inherit; text-decoration: none;">247learn.vn</a>. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
          `;
        // Đánh dấu cần gửi email
        shouldSendEmail = true;
      }

      // Gửi email nếu cần
      if (shouldSendEmail) {
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.error("Failed to send email", error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      }

      if (!user.courses.includes(courseId)) {
        user.courses.push(courseId);
        await user.save();
      }

      course.teacher = user._id;

      course.save();

      return user;
    } catch (error) {
      throw new BadRequestError(
        "Người dùng hiện tại là học viên, bạn hãy chuyển thành giáo viên trước khi thêm vào khóa học"
      );
    }
  };

  static updateCourseTeacher = async ({ courseId, email }) => {
    let user = await User.findOne({ email });

    const traineeRole = await Role.findOne({ name: "Trainee" });
    const mentorRole = await Role.findOne({ name: "Mentor" });
    if (!traineeRole || !mentorRole) {
      throw new NotFoundError("Required roles not found");
    }

    const course = await courseModel.findById(courseId);
    if (!course) throw new NotFoundError("Course not found");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "247learn.vn@gmail.com",
        pass: "glpiggogzyxtfhod",
      },
    });

    const mailOptions = {
      from: "247learn.vn@gmail.com",
      to: email,
      subject: `Chào mừng bạn đến khóa học ${course.name}`,
      html: "",
    };

    let shouldSendEmail = false;

    if (course.teacher) {
      let currentTeacher = await User.findById(course.teacher);
      if (currentTeacher) {
        mailOptions.html = `
          <!DOCTYPE html>
          <html>
          <head>
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
                      <p>Chúng tôi rất vui mừng thông báo rằng bạn đã được đăng ký thành công trở thành giáo viên của khoá học <strong>${course.name}</strong></p>
                      <p>Bạn hãy đăng nhập vào tài khoản hiện tại của bạn để truy cập vào hệ thống:</p>
                      <p>Vui lòng không chia sẻ thông tin tài khoản của bạn với người khác. Bạn có thể đổi mật khẩu sau khi đăng nhập lần đầu.</p>
                      <p>Nếu có bất kỳ thắc mắc nào, xin đừng ngần ngại liên hệ với chúng tôi qua <a href="mailto:support@247learn.vn">247learn.vn@gmail.com</a>.</p>
                  </div>
                  <div class="footer">
                  <p>&copy; 2024 <a href="https://www.247learn.vn" style="color: inherit; text-decoration: none;">247learn.vn</a>. All rights reserved.</p>
                  </div>
              </div>
          </body>
          </html>
        `;
        // Đánh dấu cần gửi email
        shouldSendEmail = true;

        currentTeacher.courses.pull(courseId);
        await currentTeacher.save();
      }
    }

    if (
      !user ||
      (user.status === "inactive" && user.roles.includes(mentorRole.id))
    ) {
      const password = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(password, 10);

      const mentorRole = await Role.findOne({ name: "Mentor" });
      if (!mentorRole) {
        throw new NotFoundError("Role 'Mentor' not found");
      }

      if (!user) {
        user = await User.create({
          email,
          firstName: "User" + Math.floor(Math.random() * 10000),
          password: passwordHash,
          roles: [mentorRole._id],
        });
      } else {
        user.password = passwordHash;
        user.status = "active";
        await user.save();
      }

      mailOptions.html = `
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
                        <p>Chúng tôi rất vui mừng thông báo rằng bạn đã được đăng ký thành công trở thành giáo viên của khoá học <strong>${course.name}</strong></p>
                        <p>Dưới đây là thông tin tài khoản của bạn để truy cập vào hệ thống:</p>
                        <ul>
                            <li>Tài khoản: <strong>${email}</strong></li>
                            <li>Mật khẩu: <strong>${password}</strong></li>
                        </ul>
                        <p>Vui lòng không chia sẻ thông tin tài khoản của bạn với người khác. Bạn có thể đổi mật khẩu sau khi đăng nhập lần đầu.</p>
                        <p>Nếu có bất kỳ thắc mắc nào, xin đừng ngần ngại liên hệ với chúng tôi qua <a href="mailto:support@247learn.vn">247learn.vn@gmail.com</a>.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 <a href="https://www.247learn.vn" style="color: inherit; text-decoration: none;">247learn.vn</a>. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
          `;
      shouldSendEmail = true;
    } else {
      mailOptions.html = `
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
                        <p>Chúng tôi rất vui mừng thông báo rằng bạn đã được đăng ký thành công trở thành giáo viên của khoá học <strong>${course.name}</strong></p>
                        <p>Bạn hãy đăng nhập vào tài khoản hiện tại của bạn để truy cập vào hệ thống:</p>
                        <p>Nếu có bất kỳ thắc mắc nào, xin đừng ngần ngại liên hệ với chúng tôi qua <a href="mailto:support@247learn.vn">247learn.vn@gmail.com</a>.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 <a href="https://www.247learn.vn" style="color: inherit; text-decoration: none;">247learn.vn</a>. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
          `;
      // Đánh dấu cần gửi email
      shouldSendEmail = true;
    }

    // Kiểm tra và cập nhật vai trò nếu người dùng inactive và là học viên
    if (
      user &&
      user.status === "inactive" &&
      user.roles.includes(traineeRole.id)
    ) {
      const password = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(password, 10);

      // Cập nhật vai trò từ Trainee sang Mentor
      user.roles = user.roles.filter(
        (role) => role.toString() !== traineeRole.id.toString()
      ); // Xóa vai trò Trainee

      user.roles.push(mentorRole._id); // Thêm vai trò Mentor

      user.status = "active"; // Cập nhật trạng thái người dùng thành active

      user.password = passwordHash;

      mailOptions.html = `
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
                                  <p>Chúng tôi rất vui mừng thông báo rằng bạn đã được đăng ký thành công trở thành giáo viên của khoá học <strong>${course.name}</strong></p>
                                  <p>Dưới đây là thông tin tài khoản của bạn để truy cập vào hệ thống:</p>
                                  <ul>
                                      <li>Tài khoản: <strong>${email}</strong></li>
                                      <li>Mật khẩu: <strong>${password}</strong></li>
                                  </ul>
                                  <p>Vui lòng không chia sẻ thông tin tài khoản của bạn với người khác. Bạn có thể đổi mật khẩu sau khi đăng nhập lần đầu.</p>
                                  <p>Nếu có bất kỳ thắc mắc nào, xin đừng ngần ngại liên hệ với chúng tôi qua <a href="mailto:support@247learn.vn">247learn.vn@gmail.com</a>.</p>
                              </div>
                              <div class="footer">
                                  <p>&copy; 2024 <a href="https://www.247learn.vn" style="color: inherit; text-decoration: none;">247learn.vn</a>. All rights reserved.</p>
                              </div>
                          </div>
                      </body>
                      </html>
                    `;

      shouldSendEmail = true;
      await user.save();
    } else if (user?.roles?.includes(traineeRole.id)) {
      throw new BadRequestError(
        "Người dùng hiện tại là học viên, bạn hãy chuyển thành giáo viên trước khi thêm vào khóa học"
      );
    }

    // Gửi email nếu cần
    if (shouldSendEmail) {
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.error("Failed to send email", error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    }

    if (!user.courses.includes(courseId)) {
      user.courses.push(courseId);
      await user.save();
    }

    course.teacher = user._id;

    course.save();

    return user;
  };

  static removeStudentFromCourse = async ({ courseId, userId }) => {
    try {
      const user = await User.findById(userId);
      const course = await courseModel.findById(courseId);

      if (!user) throw new NotFoundError("User not found");
      if (!course) throw new NotFoundError("Course not found");

      user.courses.pull(courseId);
      course.students.pull(userId);

      await Promise.all([user.save(), course.save()]);

      return user;
    } catch (error) {
      throw new BadRequestError("Failed to remove student from course");
    }
  };

  static getStudentCourses = async (userId) => {
    try {
      const user = await User.findById(userId).populate({
        path: "courses",
        populate: {
          path: "teacher",
          model: "User",
        },
      });
      if (!user) throw new NotFoundError("User not found");

      return user.courses;
    } catch (error) {
      throw new BadRequestError("Failed to get student courses");
    }
  };

  static getCourseCompletion = async ({ courseId, userId }) => {
    validateMongoDbId(courseId);
    validateMongoDbId(userId);
    try {
      const course = await courseModel.findById(courseId).populate("lessons");
      if (!course) {
        throw new NotFoundError("Course not found");
      }
      const totalLessons = course.lessons.length;
      const completedLessons = await userLessonModel.countDocuments({
        user: userId,
        lesson: { $in: course.lessons.map((lesson) => lesson._id) },
        completed: true,
      });
      const userLessonInfo = await userLessonModel.find({
        user: userId,
        lesson: { $in: course.lessons.map((lesson) => lesson._id) },
      });
      const completionPercentage = (completedLessons / totalLessons) * 100;
      return {
        completedLessons,
        completionPercentage,
        userLessonInfo,
      };
    } catch (error) {
      throw new BadRequestError("Failed to get course completion", error);
    }
  };

  static createNotification = async ({ courseId, message }) => {
    validateMongoDbId(courseId);
    try {
      const course = await courseModel.findById(courseId);
      if (!course) {
        throw new NotFoundError("Course not found");
      }

      // Get the emails of all students in the course
      const students = await User.find({ _id: { $in: course.students } });
      const studentEmails = students.map((student) => student.email);

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "247learn.vn@gmail.com",
          pass: "glpiggogzyxtfhod",
        },
      });

      const mailOptions = {
        from: "247learn.vn@gmail.com",
        to: studentEmails,
        subject: `Có thông báo mới từ giáo viên`,
        text: message,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          throw new BadRequestError("Failed to send email", error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });

      course.notifications.push({ message });
      await course.save();
    } catch (error) {
      throw new BadRequestError("Failed to create notification", error);
    }
  };
}

module.exports = {
  CourseService,
};
