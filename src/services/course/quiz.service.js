"use strict";
const validateMongoDbId = require("../../config/validateMongoDbId");
const { NotFoundError, BadRequestError } = require("../../core/error.response");
const courseModel = require("../../models/course.model");
const Quiz = require("../../models/quiz.model");
const Score = require("../../models/score.model");
const userModel = require("../../models/user.model");
const nodemailer = require("nodemailer");
const { v2: cloudinary } = require("cloudinary");
const QuizTemplate = require("../../models/quizTemplate.model");
const lessonModel = require("../../models/lesson.model");
const Role = require("../../models/role.model");

cloudinary.config({
  cloud_name: "dvsvd87sm",
  api_key: "243392977754277",
  api_secret: "YnSIAsvn7hRPqxTdIQBX9gBzihE",
});

class QuizService {
  static async sendEmailWithThrottle(mailOptionsArray, transporter, delay) {
    for (const mailOptions of mailOptionsArray) {
      await new Promise((resolve, reject) => {
        console.log("Sending email to:", mailOptions.to);
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
            reject(error);
          } else {
            console.log("Email sent:", info.response);
            setTimeout(resolve, delay); // Đợi một khoảng thời gian trước khi gửi email tiếp theo
          }
        });
      }).catch(err => { throw err; });
    }
  }

  static createQuiz = async ({
    type,
    courseIds,
    studentIds,
    name,
    essay,
    questions,
    submissionTime,
    quizTemplateId,
    lessonId,
    timeLimit,
    userId,
    isTemplateMode,
  }) => {
    let quiz;

    const user = await userModel
      .findById(userId)
      .select("roles quizCount quizLimit")
      .populate("roles", "name")
      .lean();
    const isMentor = user.roles.some((role) => role.name === "Mentor");

    // Kiểm tra điều kiện để tạo QuizTemplate mới
    const isCreatingQuizTemplate =
      !studentIds ||
      (!studentIds.length && !courseIds) ||
      (!courseIds.length && !submissionTime);

    let quizTemplate;
    if (quizTemplateId) {
      quizTemplate = await QuizTemplate.findById(quizTemplateId).lean();
      if (!quizTemplate) throw new NotFoundError("Quiz template not found");
    }

    const formattedQuestions =
      type === "multiple_choice"
        ? questions.map((question) => ({
            question: question.question,
            options: question.options,
            answer: question.answer,
            image_url: question.image_url,
          }))
        : [];

    if (quizTemplateId) {
      // Tạo Quiz từ QuizTemplate
      quiz = new Quiz({
        type: quizTemplate.type,
        name: quizTemplate.name,
        courseIds,
        studentIds,
        lessonId,
        questions: [...quizTemplate.questions, ...formattedQuestions],
        essay: quizTemplate.essay,
        submissionTime,
        quizTemplate: quizTemplateId,
      });
    } else if (isTemplateMode) {
      // Tạo QuizTemplate mới
      quiz = new QuizTemplate({
        type,
        name,
        questions: formattedQuestions,
      });
    } else {
      // Tạo Quiz mới
      quiz = new Quiz({
        type,
        name,
        courseIds,
        studentIds,
        lessonId,
        questions: formattedQuestions,
        essay:
          type === "essay"
            ? {
                title: essay.title,
                content: essay.content,
                attachment: essay.attachment,
              }
            : undefined,
        submissionTime,
        timeLimit,
      });
    }

    // Tăng quizCount và lưu nếu là Mentor và không phải tạo QuizTemplate mới
    if (
      isMentor &&
      !isTemplateMode &&
      courseIds &&
      courseIds.length > 0
    ) {
      const courses = await courseModel
        .find({ _id: { $in: courseIds } })
        .lean();

      const updatePromises = courses.map(async (course) => {
        if (!course.teacherQuizzes) {
          course.teacherQuizzes = [];
        }
        const teacherQuizInfoIndex = course.teacherQuizzes.findIndex(
          (tq) => tq.teacherId.toString() === userId.toString()
        );
        if (
          teacherQuizInfoIndex !== -1 &&
          course.teacherQuizzes[teacherQuizInfoIndex].quizCount >= 3
        ) {
          throw new Error(
            `Bạn đã đạt giới hạn tạo bài tập cho khóa học: ${course.name}`
          );
        }
        if (teacherQuizInfoIndex === -1) {
          course.teacherQuizzes.push({ teacherId: userId, quizCount: 1 });
        } else {
          course.teacherQuizzes[teacherQuizInfoIndex].quizCount += 1;
        }
        return courseModel.findByIdAndUpdate(course._id, {
          teacherQuizzes: course.teacherQuizzes,
        });
      });

      const results = await Promise.allSettled(updatePromises);
      const rejected = results.find((result) => result.status === "rejected");
      if (rejected) {
        throw new Error(rejected.reason);
      }
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "247learn.vn@gmail.com",
        pass: "glpiggogzyxtfhod",
      },
    });

    let courses, lessons;
    if (lessonId) {
      lessons = await lessonModel
        .find({ _id: { $in: lessonId } })
        .populate("courseId")
        .lean();
      courses = lessons.map((lesson) => lesson.courseId);
    } else {
      courses = await courseModel
        .find({ _id: { $in: courseIds } })
        .populate("teacher")
        .lean();
    }

    let mailOptionsArray = [];
    for (const studentId of studentIds) {
      const student = await userModel.findById(studentId).lean();
      if (!student) throw new NotFoundError("student not found");

      // Tìm thông tin khóa học và giáo viên từ dữ liệu đã truy vấn trước đó
      const course = courses.find((c) => c.students.map((id) => id.toString()).includes(studentId.toString()));
      const lesson = lessons?.find((l) => l._id.toString() === lessonId);
      const teacherName = course && course.teacher ? [course.teacher.lastName, course.teacher.firstName].filter(Boolean).join(" ") || "Giáo viên" : "Giáo viên";
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
                      <p>Giáo viên <strong>${teacherName}</strong> đã giao cho bạn một bài tập mới trong <strong>${
          course.name
        }</strong></p>
                      ${
                        lessonName
                          ? `<p>Thuộc bài học: <strong>${lessonName}</strong></p>`
                          : ""
                      }
                      <ul>
                          <li>Thời hạn nộp bài: <strong>${formattedSubmissionTime}</strong></li>
                      </ul>
                      <p>Vui lòng nộp bài đúng hạn.</p>
                      <p>Để xem danh sách bài tập, vui lòng <a href="https://www.247learn.vn/courses/view-details/${
                        course._id
                      }">click vào đây</a>.</p>
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
      mailOptionsArray.push(mailOptions);
    };

    try {
      await this.sendEmailWithThrottle(mailOptionsArray, transporter, 1000);
    } catch (error) {
      console.error("Failed to send emails, aborting the rest of the process.");
      return;
    }

    // await Promise.all(emailPromises);

    const savedQuiz = await quiz.save();

    if (lessonId) {
      const lesson = await lessonModel.findById(lessonId);
      if (!lesson) throw new NotFoundError("Lesson not found");

      // Check if the lesson already has a quiz
      if (lesson.quizzes && lesson.quizzes.length > 0) {
        throw new BadRequestError("Bài tập đã tồn tại trong bài học này");
      }

      // Update the lesson with the new quiz
      await lessonModel.updateOne(
        { _id: lessonId },
        { $set: { quizzes: [savedQuiz._id] } }
      );

      // Thêm logic để cập nhật quizCount cho giáo viên của khóa học mà bài học này thuộc về
      if (isMentor) {
        const course = await courseModel.findById(lesson.courseId).lean();
        if (!course) throw new NotFoundError("Course not found");

        const teacherQuizInfoIndex = course.teacherQuizzes.findIndex(
          (tq) => tq.teacherId.toString() === userId.toString()
        );
        if (
          teacherQuizInfoIndex !== -1 &&
          course.teacherQuizzes[teacherQuizInfoIndex].quizCount >= 3
        ) {
          throw new Error(
            `Bạn đã đạt giới hạn tạo bài tập cho khóa học: ${course.name}`
          );
        }
        if (teacherQuizInfoIndex === -1) {
          course.teacherQuizzes.push({ teacherId: userId, quizCount: 1 });
        } else {
          course.teacherQuizzes[teacherQuizInfoIndex].quizCount += 1;
        }
        await courseModel.findByIdAndUpdate(course._id, {
          teacherQuizzes: course.teacherQuizzes,
        });
      }
    }

    // Sử dụng bulkWrite để cập nhật nhiều documents một cách hiệu quả
    const studentUpdates = studentIds.map((studentId) => ({
      updateOne: {
        filter: { _id: studentId },
        update: { $push: { quizzes: savedQuiz._id } },
      },
    }));

    await userModel.bulkWrite(studentUpdates);

    const courseUpdates = courseIds.map((courseId) => ({
      updateOne: {
        filter: { _id: courseId },
        update: { $push: { quizzes: savedQuiz._id } },
      },
    }));

    await courseModel.bulkWrite(courseUpdates);

    return savedQuiz;
  };

  static saveDraftQuiz = async ({
    quizIdDraft,
    type,
    courseIds,
    name,
    essay,
    questions,
    submissionTime,
    quizTemplateId,
    lessonId,
    timeLimit,
    isDraft,
    creatorId,
    deletedQuestionIds,
  }) => {
    try {
      let quiz;
      
      // Kiểm tra xem có quizId không để quyết định cập nhật hay tạo mới
      if (quizIdDraft) {
        // Nếu có newQuestion, chỉ thêm câu hỏi mới vào mảng questions
        quiz = await Quiz.findById(quizIdDraft);
        if (!quiz) throw new NotFoundError("Quiz not found");

        // Xử lý xóa các câu hỏi đã bị xóa bằng cách sử dụng $pull
        if (deletedQuestionIds && deletedQuestionIds.length > 0) {
          await Quiz.updateOne(
            { _id: quizIdDraft },
            { $pull: { questions: { _id: { $in: deletedQuestionIds } } } }
          );
        }
  
        // Cập nhật thông tin cơ bản của quiz
        Object.assign(quiz, {
          type,
          name,
          courseIds,
          lessonId,
          essay,
          submissionTime,
          timeLimit,
          isDraft,
          creatorId,
        });
  
        // Xử lý cập nhật và thêm mới câu hỏi
        questions.forEach((question) => {
          const index = quiz.questions.findIndex(q => q._id.toString() === question._id);
          if (index !== -1) {
            // Cập nhật câu hỏi hiện có
            quiz.questions[index] = question;
          } else {
            // Thêm câu hỏi mới
            quiz.questions.push(question);
          }
        });
  
        await quiz.save();
        return quiz;
      }
        else {
        // Logic tạo bản nháp mới như trước
        let quizTemplate;
  
        if (quizTemplateId) {
          quizTemplate = await QuizTemplate.findById(quizTemplateId).lean();
          if (!quizTemplate) throw new NotFoundError("Quiz template not found");
        }
  
        // Tạo bản nháp mới
        quiz = new Quiz({
          type: quizTemplate ? quizTemplate.type : type,
          name: quizTemplate ? quizTemplate.name : name,
          courseIds,
          lessonId,
          questions: [...(quizTemplate ? quizTemplate.questions : []), ...questions],
          essay: type === "essay" ? {
              title: essay.title,
              content: essay.content,
              attachment: essay.attachment,
            } : undefined,
          submissionTime,
          timeLimit,
          isDraft: true,
          creatorId,
        });

        await quiz.save();
        return quiz;
      }
    } catch (error) {
    }
  };

  static getDraftQuiz = async ({ teacherId }) => {
    // Kiểm tra xem teacherId có vai trò là Admin hay không
    const isAdmin = await userModel.findOne({
      _id: teacherId,
      roles: { $in: (await Role.find({ name: 'Admin' })).map(role => role._id) },
    });
  
    // Nếu teacherId không phải là Admin, chỉ trả về quiz mà họ tạo
    if (!isAdmin) {
      return Quiz.find({
        creatorId: teacherId,
        isDraft: true,
      })
      .select('-creatorId -createdAt -updatedAt -studentIds -__v')
      .lean();
    }
  
    // Nếu teacherId là Admin, trả về tất cả quiz dạng nháp
    return Quiz.find({
      isDraft: true,
    })
    .select('-creatorId -createdAt -updatedAt -studentIds -__v')
    .lean();
  };

  static deleteDraftQuiz = async (quizIdDraft) => {
    try {
      const DeldraftQuiz = await Quiz.findByIdAndDelete(
        quizIdDraft
      );
      if (!DeldraftQuiz) throw new NotFoundError("No draft quiz template found");
    } catch (error) {
      console.log(error);
    }
  }

  static uploadQuestionImage = async ({
    quizId,
    isTemplateMode,
    questionId,
    filename,
  }) => {
    validateMongoDbId(quizId);
    validateMongoDbId(questionId);
    try {
      let quiz;
      const isTemplate = isTemplateMode === 'true' || isTemplateMode === true;

      if (isTemplate) {
        quiz = await QuizTemplate.findById(quizId);
      } else {
        quiz = await Quiz.findById(quizId);
      }
      // Tìm câu hỏi bằng ID
      const questionIndex = quiz.questions.findIndex(
        (question) => question._id.toString() === questionId
      );
      if (questionIndex === -1) throw new NotFoundError("Question not found");

      // Nếu câu hỏi đã có hình ảnh, xóa hình ảnh cũ trên Cloudinary
      if (quiz.questions[questionIndex].image_url) {
        const publicId = quiz.questions[questionIndex].image_url
          .split("/")
          .pop()
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId, {
          folder: "quiz_questions",
          resource_type: "image",
        });
      }

      // Tải lên hình ảnh mới và cập nhật URL
      const result = await cloudinary.uploader.upload(filename, {
        folder: "quiz_questions",
        resource_type: "image",
      });

      quiz.questions[questionIndex].image_url = result.secure_url;
      await quiz.save();

      return { message: "Image uploaded successfully", quiz };
    } catch (error) {
      throw new BadRequestError("Failed to upload question image", error);
    }
  };

  static getQuizs = async () => {
    const findQuizs = await Quiz.find().lean();
    return findQuizs;
  };

  static getAllQuizTemplates = async () => {
    try {
      const quizTemplate = await QuizTemplate.find().lean();
      if (!quizTemplate) throw new NotFoundError("quizTemplate not found");

      return quizTemplate;
    } catch (error) {
      throw new BadRequestError("Failed to get quiz template", error);
    }
  };

  static deleteQuizTemplates = async (quizTemplateId) => {
    try {
      const findQuizTemplate = await QuizTemplate.findByIdAndDelete(
        quizTemplateId
      );
      if (!findQuizTemplate) throw new NotFoundError("No quiz template found");
    } catch (error) {}
  };

  static updateQuizTemplate = async (quizTemplateId, updateQuizTemplate) => {
    const { name, questions } = updateQuizTemplate;
    const quizTemplate = await QuizTemplate.findById(quizTemplateId);

    if (!quizTemplate) {
      throw new NotFoundError("quiz template not found");
    }
    quizTemplate.name = name;

    if (quizTemplate.type === "multiple_choice") {
      for (const updateQuestion of questions) {
        const questionIndex = quizTemplate.questions.findIndex(
          (question) => question._id.toString() === updateQuestion._id
        );
        if (questionIndex !== -1) {
          quizTemplate.questions[questionIndex] = updateQuestion;
        } else {
          quizTemplate.questions.push(updateQuestion);
        }
      }
    }

    const updatedQuizTemplate = await quizTemplate.save();

    return updatedQuizTemplate;
  };

  static deleteQuestionImage = async(quizId, questionId) => {
    try {
      // Tìm quiz để lấy URL ảnh hiện tại
      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new Error('Quiz not found');

      const questionIndex = quiz.questions.findIndex(q => q._id.toString() === questionId);
      if (questionIndex === -1) throw new Error('Question not found');

      const imageUrl = quiz.questions[questionIndex].image_url;
      if (!imageUrl) throw new Error('Image does not exist');

      // Xác định publicId từ URL ảnh
      const publicId = imageUrl.split("/").pop().split(".")[0];

      // Xóa ảnh từ Cloudinary
      await cloudinary.uploader.destroy(publicId, {
        folder: "quiz_questions",
        resource_type: "image",
      });

      const result = await Quiz.findOneAndUpdate(
        { _id: quizId, "questions._id": questionId },
        {
          $set: {
            "questions.$.image_url": '',
          },
        },
        { new: true }
      );
      
      if (!result) {
        throw new Error('Quiz not found or question index is out of bounds');
      }
  
      return result;
    } catch (error) {
      throw error;
    }
  }

  static uploadFile = async ({ filename, quizId }) => {
    validateMongoDbId(quizId);
    try {
      const findQuiz = await Quiz.findById(quizId);
      if (!findQuiz) {
        throw new NotFoundError("Quiz not found");
      }

      const result = await cloudinary.uploader.upload(filename, {
        resource_type: "raw",
      });
      findQuiz.essay.attachment = result.secure_url;
      await findQuiz.save();

      return { findQuiz };
    } catch (error) {
      throw new BadRequestError(error);
    }
  };

  static getAllQuizs = async () => {
    try {
      const quizs = await Quiz.find().populate("questions").lean();

      if (!quizs) throw new NotFoundError("quizs not found");

      return quizs;
    } catch (error) {
      throw new BadRequestError("Failed to get quizs", error);
    }
  };

  static getQuizsByCourse = async (courseIds) => {
    try {
      // Find the course
      const course = await courseModel.findById(courseIds);
      if (!course) throw new NotFoundError("Course not found");

      // Find lessons that belong to the course
      const lessons = await lessonModel.find({ courseId: courseIds });

      // Extract all quiz IDs from the lessons
      const lessonQuizIds = lessons.flatMap((lesson) => lesson.quizzes);

      // Find quizzes that belong to the course
      const courseQuizzes = await Quiz.find({ courseIds: courseIds ,  $or: [{ isDraft: false }, { isDraft: { $exists: false } }]})
        .populate("questions")
        .lean();

      // Find quizzes that belong to the lessons
      const lessonQuizzes = await Quiz.find({ _id: { $in: lessonQuizIds }, $or: [{ isDraft: false }, { isDraft: { $exists: false } }]})
        .populate("questions")
        .lean();

      // Combine courseQuizzes and lessonQuizzes
      const quizzes = [...courseQuizzes, ...lessonQuizzes];

      if (!quizzes) throw new NotFoundError("Quizzes not found");

      return quizzes;
    } catch (error) {
      throw new BadRequestError("Failed to get quizs", error);
    }
  };

  static getQuizsInfoByCourse = async (courseIds) => {
    try {
      // Find the course
      const course = await courseModel.findById(courseIds);
      if (!course) throw new NotFoundError("Course not found");

      // Find lessons that belong to the course
      const lessons = await lessonModel.find({ courseId: courseIds });

      // Extract all quiz IDs from the lessons
      const lessonQuizIds = lessons.flatMap((lesson) => lesson.quizzes);

      // Find quizzes that belong to the course
      const courseQuizzes = await Quiz.find({ courseIds: courseIds, 
        $or: [{ isDraft: false }, { isDraft: { $exists: false } }] })
        .select(
          "-questions -updatedAt -createdAt -studentIds -submissionTime -__v"
        )
        .lean();

      // Find quizzes that belong to the lessons
      const lessonQuizzes = await Quiz.find({ _id: { $in: lessonQuizIds } })
        .select(
          "-questions -updatedAt -createdAt -studentIds -submissionTime -__v"
        )
        .lean();

      // Combine courseQuizzes and lessonQuizzes
      const quizzes = [...courseQuizzes, ...lessonQuizzes];

      if (!quizzes) throw new NotFoundError("Quizzes not found");

      return quizzes;
    } catch (error) {
      throw new BadRequestError("Failed to get quizs", error);
    }
  };

  static getAQuizByCourse = async (quizId) => {
    const quizs = await Quiz.find()
      .where({ _id: quizId })
      .populate("questions")
      .populate("courseIds", "name")
      .populate({
        path: "lessonId",
        populate: {
          path: "courseId",
          model: "Course",
          populate: {
            path: "teacher",
            model: "User",
            select: "name email lastName firstName",
          },
        },
      })

      .lean();

    if (!quizs) throw new NotFoundError("quizs not found");

    return quizs;
  };

  static getAQuizTemplate = async (quizTemplateId) => {
    const quizs = await QuizTemplate.find()
      .where({ _id: quizTemplateId })
      .populate("questions")
      .lean();

    if (!quizs) throw new NotFoundError("Không tồn tại");

    return quizs;
  };

  static updateQuiz = async (quizId, updatedQuizData) => {
    const { name, questions, timeLimit, submissionTime, essay } =
      updatedQuizData;
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      throw new NotFoundError("quiz not found");
    }

    const score = await Score.findOne({ quiz: quizId, isComplete: true });
    if (score) {
      throw new BadRequestError(
        "Không thể cập nhật khóa học vì đã có học sinh làm bài."
      );
    }

    quiz.name = name;
    quiz.submissionTime = submissionTime;
    quiz.timeLimit = timeLimit;

    if (quiz.type === "multiple_choice") {
      for (const updateQuestion of questions) {
        const questionIndex = quiz.questions.findIndex(
          (question) => question._id.toString() === updateQuestion._id
        );
        if (questionIndex !== -1) {
          quiz.questions[questionIndex] = updateQuestion;
        } else {
          quiz.questions.push(updateQuestion);
        }
      }
    } else if (quiz.type === "essay") {
      quiz.essay = {
        title: essay.title,
        content: essay.content,
        attachment: essay.attachment,
      };
      quiz.name = essay.title;
    }

    const updatedQuiz = await quiz.save();

    return updatedQuiz;
  };

  static deleteQuiz = async ({ quizId, userId }) => {
    try {
      validateMongoDbId(quizId);

      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new NotFoundError("Quiz not found");

      // Xóa các hình ảnh của câu hỏi trên Cloudinary
      for (const question of quiz.questions) {
        if (question.image_url) {
          const publicId = question.image_url.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        }
      }

      await Score.deleteMany({ quiz: quizId });

      const coursesToUpdate = await courseModel
        .find({ quizzes: quizId })
        .lean();

      const user = await userModel
        .findById(userId)
        .populate("roles", "name")
        .lean();

      const isAdmin = user.roles.some(
        (role) => role.name === "Admin" || role.name === "Admin-Super"
      );

      for (const course of coursesToUpdate) {
        // Kiểm tra nếu userId khớp với bất kỳ teacherId nào trong teacherQuizzes
        const isTeacherInCourse = course.teacherQuizzes.some(
          (teacherQuiz) =>
            teacherQuiz.teacherId.toString() === userId.toString()
        );

        if (isTeacherInCourse || isAdmin) {
          const updatedTeacherQuizzes = course.teacherQuizzes.map(
            (teacherQuiz) => {
              // Giảm quizCount cho tất cả giáo viên trong teacherQuizzes
              const newQuizCount = Math.max(0, teacherQuiz.quizCount - 1);
              return { ...teacherQuiz, quizCount: newQuizCount };
            }
          );

          await courseModel.findByIdAndUpdate(course._id, {
            teacherQuizzes: updatedTeacherQuizzes,
          });
        }
      }

      await courseModel.updateMany(
        { quizzes: quizId },
        { $pull: { quizzes: quizId } }
      );

      if (quiz.lessonId) {
        await lessonModel.updateOne(
          { _id: quiz.lessonId },
          { $pull: { quizzes: quizId } }
        );
      }

      await userModel.updateMany(
        { quizzes: quizId },
        { $pull: { quizzes: quizId } }
      );

      const deletedQuiz = await Quiz.findByIdAndDelete(quizId);

      return deletedQuiz;
    } catch (error) {
      console.error(error);
      throw new BadRequestError("Failed to delete quiz", error);
    }
  };

  static deleteQuestion = async (quizId, questionId) => {
    try {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new NotFoundError("quiz not found");

      const questionExists = quiz.questions.some(
        (question) => question._id.toString() === questionId
      );

      if (!questionExists) throw new NotFoundError("question not found");

      quiz.questions = quiz.questions.filter(
        (question) => question._id.toString() !== questionId
      );

      if (quiz.questions.length === 0) {
        await Quiz.findByIdAndDelete(quizId);
      } else {
        await quiz.save();
      }

      return quiz;
    } catch (error) {
      throw new BadRequestError("Failed to delete question", error);
    }
  };

  static async startQuiz(quizId, userId) {
    const quiz = await Quiz.findById(quizId)
      .select("-createdAt -updatedAt -__v -questions")
      .lean();
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    // Kiểm tra xem thời gian hiện tại đã vượt qua thời gian kết thúc dự kiến của bài quiz chưa
    const currentTime = new Date();
    if (quiz.submissionTime && currentTime > new Date(quiz.submissionTime)) {
      throw new Error("Thời gian làm bài đã hết, không thể bắt đầu làm bài.");
    }

    // Kiểm tra xem đã có bản ghi điểm cho người dùng và quiz này chưa
    let scoreRecord = await Score.findOne({
      quiz: quizId,
      user: userId,
    }).lean();

    // Nếu không có bản ghi hoặc bản ghi chưa hoàn thành
    if (!scoreRecord || (scoreRecord && !scoreRecord.isComplete)) {
      scoreRecord = await Score.findOneAndUpdate(
        {
          quiz: quizId,
          user: userId,
        },
        {
          $setOnInsert: { startTime: new Date(), isComplete: false },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      ).lean();
    }

    return scoreRecord;
  }

  static submitQuiz = async (quizId, userId, answers) => {
    try {
      if (!answers || !Array.isArray(answers)) {
        throw new BadRequestError("Invalid answers format");
      }
  
      const scoreRecord = await Score.findOne({ quiz: quizId, user: userId });
      if (!scoreRecord) throw new NotFoundError("Score record not found");
  
      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new NotFoundError("No quiz found");
  
      // Điểm số cho mỗi câu trả lời đúng
      const pointsPerCorrectAnswer = 10;
      let correctAnswersCount = 0; // Số câu trả lời đúng
  
      // Chuyển đổi mảng answers thành một đối tượng để dễ dàng truy cập
      const answersMap = answers.reduce((acc, answerObj) => {
        const questionId = Object.keys(answerObj)[0];
        acc[questionId] = answerObj[questionId];
        return acc;
      }, {});
  
      // Duyệt qua tất cả các câu hỏi trong quiz
      quiz.questions.forEach((question) => {
        const userAnswer = answersMap[question._id.toString()];
        if (userAnswer && userAnswer === question.answer) {
          correctAnswersCount++;
        }
      });
  
      // Tính tổng điểm dựa trên số câu trả lời đúng
      let totalScore = correctAnswersCount * pointsPerCorrectAnswer;
  
      // Cập nhật điểm số và trạng thái hoàn thành cho bản ghi điểm
      scoreRecord.score = totalScore;
      scoreRecord.answers = answers;
      scoreRecord.isComplete = true;
      scoreRecord.submitTime = Date.now();
      await scoreRecord.save();
  
      return scoreRecord;
    } catch (error) {
      throw new BadRequestError("Failed to submit quiz", error);
    }
  };

  static uploadFileUserSubmit = async ({ filename, quizId, userId }) => {
    validateMongoDbId(quizId);
    validateMongoDbId(userId);
    try {
      const findQuiz = await Quiz.findById(quizId);
      if (!findQuiz) {
        throw new NotFoundError("Quiz not found");
      }

      const score = await Score.findOne({ quiz: quizId, user: userId });

      if (score.filename) {
        // Delete the old image from Cloudinary
        await cloudinary.uploader.destroy(score.filename, {
          resource_type: "score",
        });
      }

      const result = await cloudinary.uploader.upload(filename, {
        resource_type: "raw",
      });

      score.filename = result.secure_url;

      await score.save();

      return score;
    } catch (error) {
      throw new BadRequestError(error);
    }
  };

  static submitQuizEssay = async ({ userId, quizId, essayAnswer }) => {
    try {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new NotFoundError("no quiz found");

      const existingScore = await Score.findOne({ user: userId, quiz: quizId });

      if (existingScore) {
        existingScore.essayAnswer = essayAnswer;
        scoreRecord.isComplete = true;
        await existingScore.save();
        return existingScore;
      } else {
        const userScore = new Score({
          user: userId,
          quiz: quizId,
          essayAnswer: essayAnswer,
          isComplete: true,
        });
        await userScore.save();
        return userScore;
      }
    } catch (error) {}
  };

  static getScoreByUser = async (userId) => {
    try {
      const scores = await Score.find({ user: userId }).populate("quiz").lean();

      if (!scores) throw new NotFoundError("scores not found");

      return scores;
    } catch (error) {
      throw new BadRequestError("Failed to get scores", error);
    }
  };

  static getScoreByUserId = async (userId, quizId) => {
    try {
      const scores = await Score.find({ user: userId, quiz: quizId })
        .populate("quiz", "_id name")
        .lean();

      if (!scores) throw new NotFoundError("scores not found");

      const scoreAndAnswers = scores.map((score) => ({
        score: score.score,
        answers: score.answers,
        quiz: score.quiz,
      }));

      return scoreAndAnswers;
    } catch (error) {
      throw new BadRequestError("Failed to get scores and answers", error);
    }
  };

  static getScoreByInfo = async (userId) => {
    try {
      const scores = await Score.find({ user: userId })
        .select("_id score isComplete user")
        .populate("quiz", "_id name")
        .lean();

      if (!scores) throw new NotFoundError("scores not found");

      return scores;
    } catch (error) {
      throw new BadRequestError("Failed to get scores and answers", error);
    }
  };

  static getScoreByQuizId = async (quizId) => {
    try {
      const scores = await Score.find({ quiz: quizId })
        .populate("quiz")
        .populate("user")
        .lean();

      if (!scores) throw new NotFoundError("scores not found");

      return scores;
    } catch (error) {
      throw new BadRequestError("Failed to get scores", error);
    }
  };

  static deleteScorebyQuiz = async ({ scoreId }) => {
    try {
      const deletedScore = await Score.deleteOne({ _id: scoreId });
      if (!deletedScore) throw new NotFoundError("No score found");
    } catch (error) {
      throw new BadRequestError("Failed to delete score", error);
    }
  };

  static getQuizzesByStudentAndCourse = async (studentId, courseId) => {
    // Validate studentId and courseId
    validateMongoDbId(studentId);
    validateMongoDbId(courseId);

    // Find the student and course in parallel
    const [student, course] = await Promise.all([
      userModel.findById(studentId),
      courseModel.findById(courseId),
    ]);

    if (!student) throw new NotFoundError("Student not found");
    if (!course) throw new NotFoundError("Course not found");

    // Find lessons that belong to the course
    const lessons = await lessonModel.find({ courseId: courseId });

    // Extract all quiz IDs from the lessons
    const lessonQuizIds = lessons.flatMap((lesson) => lesson.quizzes);

    // Find quizzes that belong to the course and assigned to the student
    const [courseQuizzes, lessonQuizzes] = await Promise.all([
      Quiz.find({
        _id: { $in: student.quizzes },
        courseIds: courseId,
      })
        .select("-updatedAt -createdAt -__v")
        .populate("courseIds", "_id name")
        .populate({
          path: "lessonId",
          populate: {
            path: "courseId",
            model: "Course",
            populate: {
              path: "teacher",
              model: "User",
              select: "name email lastName firstName",
            },
          },
        })
        .lean(),
      Quiz.find({
        _id: { $in: [...student.quizzes, ...lessonQuizIds] },
      })
        .select("-updatedAt -createdAt -__v")
        .populate("courseIds", "_id name")
        .populate({
          path: "lessonId",
          populate: {
            path: "courseId",
            model: "Course",
            populate: {
              path: "teacher",
              model: "User",
              select: "name email lastName firstName",
            },
          },
        })
        .lean(),
    ]);

    // Combine courseQuizzes and lessonQuizzes and remove duplicates
    const combinedQuizzes = [...courseQuizzes, ...lessonQuizzes];
    const uniqueQuizzes = Array.from(
      new Set(combinedQuizzes.map((a) => a._id.toString()))
    ).map((_id) => combinedQuizzes.find((a) => a._id.toString() === _id));

    return uniqueQuizzes;
  };

  static updateScore = async (scoresToUpdate) => {
    try {
      if (!Array.isArray(scoresToUpdate)) {
        throw new BadRequestError("scoresToUpdate must be an array");
      }

      const updateScores = [];

      for (const { scoreId, updateScore } of scoresToUpdate) {
        const score = await Score.findById(scoreId);
        if (!score) throw new NotFoundError("score not found");

        score.score = updateScore;
        await score.save();
        updateScores.push(score);
      }

      return updateScores;
    } catch (error) {
      throw new BadRequestError("Failed to update score", error);
    }
  };

  static getAllScoresByCourseId = async (courseId) => {
    try {
      // Validate the courseId
      validateMongoDbId(courseId);

      // Find the course to ensure it exists
      const course = await courseModel.findById(courseId);
      if (!course) throw new NotFoundError("Course not found");

      // Get all quizzes associated with the course
      const quizzes = await Quiz.find({ courseIds: courseId });

      // Map through quizzes and get scores for each quiz
      const scoresPromises = quizzes.map(async (quiz) => {
        const scores = await Score.find({ quiz: quiz._id })
          .populate("user", "email")
          .lean();
        return {
          quizId: quiz._id,
          quizName: quiz.name,
          scores: scores.map((score) => {
            // Kiểm tra xem user có tồn tại không trước khi truy cập các thuộc tính
            const user = score.user;
            return {
              userId: user ? user._id : null,
              userEmail: user ? user.email : "No Email",
              score: score.score,
              submitTime: score.submitTime,
              isComplete: score.isComplete,
            };
          }),
        };
      });

      // Resolve all promises to get the scores
      const allScores = await Promise.all(scoresPromises);

      return allScores;
    } catch (error) {
      console.error("Error in getAllScoresByCourseId:", error);
      throw new BadRequestError("Failed to get scores by course ID", error);
    }
  };
}

exports.QuizService = QuizService;
