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

cloudinary.config({
  cloud_name: "dvsvd87sm",
  api_key: "243392977754277",
  api_secret: "YnSIAsvn7hRPqxTdIQBX9gBzihE",
});

class QuizService {
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
  }) => {
    try {
      let quiz;
      if (quizTemplateId) {
        const quizTemplate = await QuizTemplate.findById(quizTemplateId);
        if (!quizTemplate) throw new NotFoundError("Quiz tempalte not found");

        const combinedQuestions = [...quizTemplate.questions, ...questions];

        quiz = new Quiz({
          type: quizTemplate.type,
          name: quizTemplate.name,
          courseIds,
          studentIds,
          lessonId,
          questions: combinedQuestions,
          essay: quizTemplate.essay,
          submissionTime,
          quizTemplate: quizTemplateId,
        });
      } else {
        if (type === "multiple_choice") {
          const formattedQuestions = [];

          for (const question of questions) {
            const formattedQuestion = {
              question: question.question,
              options: question.options,
              answer: question.answer,
            };
            formattedQuestions.push(formattedQuestion);
          }

          if (
            (!studentIds || !studentIds.length) &&
            (!courseIds || !courseIds.length) &&
            !submissionTime
          ) {
            quiz = new QuizTemplate({
              type,
              name,
              questions: formattedQuestions,
            });
          } else {
            quiz = new Quiz({
              type,
              name,
              courseIds,
              studentIds,
              lessonId,
              questions: formattedQuestions,
              submissionTime,
              timeLimit,
            });
          }
        } else if (type === "essay") {
          const formattedEssay = {
            title: essay.title,
            content: essay.content,
            attachment: essay.attachment,
          };

          quiz = new Quiz({
            type,
            name,
            courseIds,
            studentIds,
            lessonId,
            essay: formattedEssay,
            submissionTime,
          });
        } else {
          throw new BadRequestError("Invalid quiz type");
        }
      }

      const emailPromises = studentIds.map(async (studentId) => {
        const student = await userModel.findById(studentId);
        if (!student) throw new NotFoundError("student not found");

        let course,
          lessonName,
          teacherName = "N/A"; // Initialize teacherName here
        if (lessonId) {
          const lesson = await lessonModel.findById(lessonId).populate({
            path: "courseId",
            populate: {
              path: "teacher",
              model: "User", // Replace 'User' with the actual model name for the teacher
            },
          });
          course = lesson.courseId;
          lessonName = lesson.name;
          if (course && course.teacher) {
            teacherName = `${course.teacher.lastName} ${course.teacher.firstName}`;
          }
        } else {
          course = await courseModel
            .findOne({ _id: { $in: courseIds } })
            .populate("teacher");

          if (course && course.teacher) {
            teacherName = `${course.teacher.lastName} ${course.teacher.firstName}`;
          }
        }
        if (!course) throw new NotFoundError("course not found");

        const formattedSubmissionTime = submissionTime
          ? new Date(submissionTime).toLocaleString("vi-VN", {
              hour12: false,
              timeZone: "Asia/Ho_Chi_Minh",
            })
          : "Không có thời hạn";

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "247learn.vn@gmail.com",
            pass: "glpiggogzyxtfhod",
          },
        });

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
                      <p>Nếu có bất kỳ thắc mắc nào, xin đừng ngần ngại liên hệ với chúng tôi qua <a href="mailto:support@247learn.vn">247learn.vn@gmail.com</a>.</p>
                  </div>
                  <div class="footer">
                      <p>&copy; 2024 <a href="https://www.247learn.vn" style="color: inherit; text-decoration: none;">247learn.vn</a>. All rights reserved.</p>
                  </div>
              </div>
          </body>
          </html>
        `,
        };

        return transporter.sendMail(mailOptions);
      });

      await Promise.all(emailPromises);

      const savedQuiz = await quiz.save();

      if (lessonId) {
        const lesson = await lessonModel.findById(lessonId);
        if (!lesson) throw new NotFoundError("Lesson not found");

        // Check if the lesson already has a quiz
        if (lesson.quizzes && lesson.quizzes.length > 0) {
          throw new BadRequestError("A quiz for this lesson already exists");
        }

        // Update the lesson with the new quiz
        lesson.quizzes = [savedQuiz._id];
        await lesson.save();
      }

      for (const studentId of studentIds) {
        const student = await userModel.findById(studentId);
        student.quizzes.push(savedQuiz._id);
        await student.save();
      }

      for (const courseId of courseIds) {
        const course = await courseModel
          .findByIdAndUpdate(
            courseId,
            {
              $push: { quizzes: savedQuiz._id },
            },
            { new: true }
          )
          .populate("quizzes")
          .populate("students");

        if (!course) throw new NotFoundError("course not found");
      }

      return savedQuiz;
    } catch (error) {
      console.log("🚀 ~ error:", error);
      throw new BadRequestError("Failed to create quiz", error);
    }
  };

  static uploadQuestionImage = async ({ quizId, questionId, filename }) => {
    validateMongoDbId(quizId);
    validateMongoDbId(questionId);
    try {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new NotFoundError("Quiz not found");

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
      const courseQuizzes = await Quiz.find({ courseIds: courseIds })
        .populate("questions")
        .lean();

      // Find quizzes that belong to the lessons
      const lessonQuizzes = await Quiz.find({ _id: { $in: lessonQuizIds } })
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
      const courseQuizzes = await Quiz.find({ courseIds: courseIds })
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

  static deleteQuiz = async ({ quizId }) => {
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

      const deletedQuiz = await Quiz.findByIdAndDelete(quizId);

      return deletedQuiz;
    } catch (error) {
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
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    let scoreRecord = await Score.findOne({ quiz: quizId, user: userId });
    if (!scoreRecord) {
      // Nếu chưa có bản ghi điểm, tạo mới với startTime là thời điểm hiện tại
      scoreRecord = new Score({
        quiz: quizId,
        user: userId,
        startTime: new Date(), // Thiết lập thời gian bắt đầu làm bài
        isComplete: false,
      });
    } else {
      // Nếu đã có bản ghi, chỉ cập nhật startTime
      scoreRecord.startTime = new Date();
    }

    await scoreRecord.save();
    return scoreRecord;
  }

  static submitQuiz = async (quizId, userId, answer) => {
    try {
      let score = 0;
      const maxScore = 10; // Điểm số tối đa

      const scoreRecord = await Score.findOne({ quiz: quizId, user: userId });
      if (!scoreRecord) throw new NotFoundError("Score record not found");

      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new NotFoundError("no quiz found");

      // Kiểm tra thời gian nộp bài
      const currentTime = new Date();
      const startTime = scoreRecord.startTime;
      const timeLimitInMilliseconds = quiz.timeLimit * 60000;
      const endTime = new Date(startTime.getTime() + timeLimitInMilliseconds);

      // if (currentTime > endTime) {
      //   throw new BadRequestError("Hết hạn làm bài");
      // }

      const existingScore = await Score.findOne({ user: userId, quiz: quizId });

      for (let i = 0; i < quiz.questions.length; i++) {
        const question = quiz.questions[i];
        const userAnswer = answer[i]
          ? answer[i][Object.keys(answer[i])[0]]
          : null;

        if (
          userAnswer === undefined ||
          userAnswer === null ||
          question.answer !== userAnswer
        ) {
          continue;
        } else {
          score++;
        }
      }
      // Cập nhật điểm số và trạng thái hoàn thành cho bản ghi điểm
      scoreRecord.score = ((score / quiz.questions.length) * maxScore).toFixed(
        2
      );
      scoreRecord.answers = answer;
      scoreRecord.isComplete = true;
      scoreRecord.submitTime = currentTime;
      await scoreRecord.save();
      return scoreRecord;
    } catch (error) {
      console.log("🚀 ~ error:", error);
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
        .select("-questions -updatedAt -createdAt -__v")
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
        .populate("courseIds", "_id name")
        .select("-questions -updatedAt -createdAt -__v")
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
}

exports.QuizService = QuizService;
