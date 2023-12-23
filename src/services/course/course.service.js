const { NotFoundError, BadRequestError } = require("../../core/error.response");
const courseModel = require("../../models/course.model");
const lessonModel = require("../../models/lesson.model");
const User = require("../../models/user.model");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const userLessonModel = require("../../models/userLesson.model");
const validateMongoDbId = require("../../config/validateMongoDbId");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: "dvsvd87sm",
  api_key: "243392977754277",
  api_secret: "YnSIAsvn7hRPqxTdIQBX9gBzihE",
});

class CourseService {
  static createCourse = async ({ name, title, userId }) => {
    try {
      const course = await courseModel.create({
        name,
        title,
      });
      const createCourse = course.save();

      const user = await User.findById(userId);
      if (!user) throw new NotFoundError("User not found");

      user.courses.push(course._id);
      await user.save();

      return createCourse;
    } catch (error) {
      console.log("🚀 ~ error:", error);
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
        // Delete the old image from Cloudinary
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
        .populate("students", "lastName")
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
      console.log("🚀 ~ error:", error);
      throw new BadRequestError("Course is failed", error);
    }
  };

  static getCoursePublic = async () => {
    const course = await courseModel.find({
      showCourse: true,
    });
    return course;
  };

  static updateCourse = async ({ id, name, title }) => {
    try {
      const course = await courseModel.findById(id);

      if (!course) throw new BadRequestError("Course not found");

      course.name = name;
      course.title = title;

      const updateCourse = await course.save();

      return updateCourse;
    } catch (error) {
      throw new BadRequestError("Failed to update course", error);
    }
  };

  static deleteCourse = async ({ id }) => {
    try {
      await lessonModel.deleteMany({ courseId: id });

      const course = await courseModel.findByIdAndDelete(id);
      const publicId = course.filename;
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });
      console.log("Deleted video from Cloudinary:", result);

      if (!course) throw new NotFoundError("Course not found");
    } catch (error) {
      throw new BadRequestError(error);
    }
  };

  static addStudentToCours = async ({ courseId, email }) => {
    try {
      let user = await User.findOne({ email });

      if (user?.roles?.includes("Mentor") || user?.roles?.includes("Admin")) {
        throw new BadRequestError("Không thể thêm người dùng này vào khóa học");
      }

      if (user && user.status === "inactive") {
        user.status = "active";
        await user.save();
      }

      const course = await courseModel.findById(courseId);
      if (!course) throw new NotFoundError("Khóa học không tồn tại");

      if (!user) {
        const password = Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(password, 10);

        user = await User.create({
          email,
          lastName: "User" + Math.floor(Math.random() * 10000),
          password: passwordHash,
          roles: ["Trainee"],
        });

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "kimochi2033@gmail.com",
            pass: "fmthngflsjewmpyl",
          },
        });

        const mailOptions = {
          from: "kimochi2033@gmail.com",
          to: email,
          subject: `Chào mừng bạn đến khóa học ${course.name}`,
          text: `Chào mừng bạn đến khóa học. Tài khoản của bạn là: ${email}, mật khẩu của bạn là: ${password}`,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
            throw new BadRequestError("Failed to send email", error);
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
      throw new BadRequestError("Không thể thêm người dùng này vào khóa học");
    }
  };

  static addTeacherToCours = async ({ courseId, email }) => {
    try {
      let user = await User.findOne({ email });

      if (user && user.status === "inactive") {
        user.status = "active";
        await user.save();
      }

      if (user?.roles?.includes("Trainee")) {
        throw new BadRequestError("Không thể thêm người dùng này vào khóa học");
      }

      const course = await courseModel.findById(courseId);
      if (!course) throw new NotFoundError("Course not found");

      if (course.teacher) {
        throw new BadRequestError("Không thể thêm người dùng này vào khóa học");
      }

      if (!user) {
        const password = Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(password, 10);

        user = await User.create({
          email,
          lastName: "User" + Math.floor(Math.random() * 10000),
          password: passwordHash,
          roles: ["Mentor"],
          courses: [courseId],
        });

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "kimochi2033@gmail.com",
            pass: "fmthngflsjewmpyl",
          },
        });

        const mailOptions = {
          from: "kimochi2033@gmail.com",
          to: email,
          subject: `Chào mừng bạn đến khóa học ${course.name}`,
          text: `Chào mừng bạn đến khóa học. Tài khoản của bạn là: ${email}, mật khẩu của bạn là: ${password}`,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
            throw new BadRequestError("Failed to send email", error);
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
      throw new BadRequestError("Không thể thêm người dùng này vào khóa học");
    }
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

  // static removeStudentFromCourse = async ({ courseId, userId }) => {
  //   try {
  //     const user = await User.findById(userId);
  //     const course = await courseModel.findById(courseId);

  //     if (!user) throw new NotFoundError("User not found");
  //     if (!course) throw new NotFoundError("Course not found");

  //     user.courses.pull(courseId);
  //     course.students.pull(userId);

  //     await Promise.all([user.save(), course.save()]);

  //     return user;
  //   } catch (error) {
  //     throw new BadRequestError("Failed to remove student from course");
  //   }
  // };

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
          user: "kimochi2033@gmail.com",
          pass: "fmthngflsjewmpyl",
        },
      });

      const mailOptions = {
        from: "kimochi2033@gmail.com",
        to: studentEmails,
        subject: `Có thông báo mới từ giáo viên`,
        text: message,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          throw new BadRequestError("Failed to send email", error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });

      course.notifications.push({ message });
      await course.save();
    } catch (error) {
      console.log("🚀 ~ error:", error);
      throw new BadRequestError("Failed to create notification", error);
    }
  };
}

module.exports = {
  CourseService,
};
