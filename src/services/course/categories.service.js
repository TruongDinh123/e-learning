"use strict";

const categoryModel = require("../../models/category.model");
const courseModel = require("../../models/course.model");
const { convertToObjectIdMongodb } = require("../../utils/index");

class CategoryService {
  static createCategoryAndSubCourse = async (name) => {
    // Tạo một Category mới
    const category = new categoryModel({
      name: name,
    });

    // Lưu Category vào database
    await category.save();

    // // Tạo và lưu các SubCourse
    // for (let i = 0; i < subCourses.length; i++) {
    //   const subCourse = new subCourseModel({
    //     name: subCourses[i].name,
    //     courses: subCourses[i].courses,
    //     category: category._id,
    //   });

    //   // Lưu SubCourse vào database
    //   await subCourse.save();

    //   // Thêm SubCourse vào Category
    //   category.subCourses.push(subCourse._id);
    // }

    // Cập nhật Category trong database
    await category.save();
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

      if (
        !loggedInUser?.roles?.includes("Admin") &&
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

        if (!user) {
          user = await User.create({
            email,
            firstName: "User" + Math.floor(Math.random() * 10000),
            password: passwordHash,
            roles: ["Trainee"],
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
              <p>Nếu có bất kỳ thắc mắc nào, xin đừng ngần ngại liên hệ với chúng tôi qua <a href="mailto: 247learn.vn@gmail.com"> 247learn.vn@gmail.com</a>.</p>
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
          <p>Nếu có bất kỳ thắc mắc nào, xin đừng ngần ngại liên hệ với chúng tôi qua <a href="mailto: 247learn.vn@gmail.com"> 247learn.vn@gmail.com</a>.</p>
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
      throw new BadRequestError("Lỗi server");
    }
  };
  static getAllCategoriesById = async (categoryId) => {
    if (categoryId) {
      return await categoryModel
        .findById(categoryId)
        .populate({
          path: "courses",
          select: "name title image_url teacher lesson -_id",
        })
        .lean();
    }
    return await categoryModel.find().populate({
      path: "courses",
      select: "name title image_url teacher lesson -_id",
    });
  };

  static getAllCategories = async () => {
    const categories = await categoryModel
      .find()
      .populate({
        path: "courses",
        select: "name title image_url teacher lessons showCourse _id",
      })
      .lean();
    return categories;
  };

  static updateCategory = async (categoryId, categoryName) => {
    try {
      const category = await categoryModel.findById(categoryId);
      if (category) {
        category.name = categoryName;
        await category.save();
      }
    } catch (error) {
      console.log("🚀 ~ error:", error);
    }
  };

  static deleteCategory = async (categoryId) => {
    const category = await categoryModel.findById(categoryId);
    if (category) {
      await courseModel.updateMany(
        {
          category: convertToObjectIdMongodb(categoryId),
        },
        { $unset: { category: "" } }
      );
      await categoryModel.findByIdAndDelete(categoryId);
    }
  };

  //sub-course
  static getAllSubCoursesById = async (subCourseId) => {
    if (subCourseId) {
      return await subCourseModel
        .findById(subCourseId)
        .populate({
          path: "courses",
          select: "name title image_url teacher -_id",
        })
        .lean();
    }
    return await subCourseModel.find().populate({
      path: "courses",
      select: "name title image_url teacher -_id",
    });
  };

  static getAllSubCourses = async () => {
    const subCourses = await subCourseModel
      .find()
      .populate({
        path: "courses",
        select: "name title image_url teacher -_id",
      })
      .lean();
    return subCourses;
  };
}

module.exports = {
  CategoryService,
};
