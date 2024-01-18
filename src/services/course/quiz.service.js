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
              questions: formattedQuestions,
              submissionTime,
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
          subject: "Bài tập mới",
          text: `Một bài tập ${name} đã được giao cho bạn. hãy hoàn thành trước ${submissionTime}`,
        };

        return transporter.sendMail(mailOptions);
      });

      await Promise.all(emailPromises);

      const savedQuiz = await quiz.save();

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
      throw new BadRequestError("Failed to create quiz", error);
    }
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
      const quizs = await Quiz.find({ courseIds: courseIds })
        .populate("questions")
        .lean();

      if (!quizs) throw new NotFoundError("quizs not found");

      return quizs;
    } catch (error) {
      throw new BadRequestError("Failed to get quizs", error);
    }
  };

  static getAQuizByCourse = async (quizId) => {
    const quizs = await Quiz.find()
      .where({ _id: quizId })
      .populate("questions")
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

  // static updateQuiz = async (quizId, updatedQuizData) => {
  //   const { name, questions } = updatedQuizData;
  //   const quiz = await Quiz.findById(quizId);

  //   if (!quiz) {
  //     throw new NotFoundError("quiz not found");
  //   }

  //   const score = await Score.findOne({ quiz: quizId, isComplete: true });
  //   if (score) {
  //     throw new BadRequestError("Cannot update quiz as it has already been completed by a student");
  //   }

  //   quiz.name = name;
  //   for (const updateQuestion of questions) {
  //     const questionIndex = quiz.questions.findIndex(
  //       (question) => question._id.toString() === updateQuestion._id
  //     );
  //     if (questionIndex !== -1) {
  //       quiz.questions[questionIndex] = updateQuestion;
  //     } else {
  //       quiz.questions.push(updateQuestion);
  //     }
  //   }
  //   const updatedQuiz = await quiz.save();

  //   return updatedQuiz;
  // };

  static updateQuiz = async (quizId, updatedQuizData) => {
    const { name, questions, submissionTime, essay } = updatedQuizData;
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
    // for (const updateQuestion of questions) {
    //   const questionIndex = quiz.questions.findIndex(
    //     (question) => question._id.toString() === updateQuestion._id
    //   );
    //   if (questionIndex !== -1) {
    //     quiz.questions[questionIndex] = updateQuestion;
    //   } else {
    //     quiz.questions.push(updateQuestion);
    //   }
    // }

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

      // const findCourse = await courseModel.findByIdAndUpdate(quiz.quizId, {
      //   quizzes: null,
      // });

      await courseModel.updateMany(
        { quizzes: quizId },
        { $pull: { quizzes: quizId } }
      );

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

  static submitQuiz = async (quizId, userId, answer) => {
    try {
      let score = 0;
      const maxScore = 10; // Điểm số tối đa

      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new NotFoundError("no quiz found");

      const existingScore = await Score.findOne({ user: userId, quiz: quizId });

      for (let i = 0; i < quiz.questions.length; i++) {
        const question = quiz.questions[i];
        const userAnswer = answer[i][Object.keys(answer[i])[0]];

        if (question.answer === userAnswer) {
          score++;
        }
      }

      if (existingScore) {
        existingScore.score = (
          (score / quiz.questions.length) *
          maxScore
        ).toFixed(2);
        existingScore.answers = answer;
        existingScore.isComplete = true;
        await existingScore.save();

        if (existingScore.createdAt > quiz.submissionTime) {
          existingScore.isComplete = false;
          throw new BadRequestError("Submission time has passed");
        }

        return existingScore;
      } else {
        const userScore = new Score({
          user: userId,
          quiz: quizId,
          score: ((score / quiz.questions.length) * maxScore).toFixed(2),
          answers: answer,
          isComplete: true,
        });
        await userScore.save();

        if (userScore.createdAt > quiz.submissionTime) {
          userScore.isComplete = false;
          throw new BadRequestError("Submission time has passed");
        }

        return userScore;
      }
    } catch (error) {}
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
      const scores = await Score.find({ user: userId })
        .populate("quiz")
        .populate("assignment")
        .lean();

      if (!scores) throw new NotFoundError("scores not found");

      return scores;
    } catch (error) {
      throw new BadRequestError("Failed to get scores", error);
    }
  };

  static getScoreByUserId = async (userId, quizId) => {
    try {
      const scores = await Score.find({ user: userId, quiz: quizId })
        .populate("quiz")
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

    // Find the student
    const student = await userModel.findById(studentId);
    if (!student) throw new NotFoundError("Student not found");

    // Find the course
    const course = await courseModel.findById(courseId);
    if (!course) throw new NotFoundError("Course not found");

    // Find quizzes that belong to the course and assigned to the student
    const quizzes = await Quiz.find({
      _id: { $in: student.quizzes },
      courseIds: courseId,
    })
      .populate("questions")
      .lean();


    return quizzes.length ? quizzes : [];
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
