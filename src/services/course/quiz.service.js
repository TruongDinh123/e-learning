"use strict";
const validateMongoDbId = require("../../config/validateMongoDbId");
const { NotFoundError, BadRequestError } = require("../../core/error.response");
const courseModel = require("../../models/course.model");
const Quiz = require("../../models/quiz.model");
const Score = require("../../models/score.model");
const userModel = require("../../models/user.model");
const nodemailer = require("nodemailer");
const { v2: cloudinary } = require("cloudinary");

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
  }) => {
    try {
      let quiz;
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

        quiz = new Quiz({
          type,
          name,
          courseIds,
          studentIds,
          questions: formattedQuestions,
          submissionTime,
        });
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

      const emailPromises = studentIds.map(async (studentId) => {
        const student = await userModel.findById(studentId);
        if (!student) throw new NotFoundError("student not found");

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "kimochi2033@gmail.com",
            pass: "fmthngflsjewmpyl",
          },
        });

        const mailOptions = {
          from: "kimochi2033@gmail.com",
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
      console.error(error);
      throw new BadRequestError("Failed to create quiz", error);
    }
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
      throw new BadRequestError("Cannot update quiz as it has already been completed by a student");
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
    }
  
    const updatedQuiz = await quiz.save();
  
    return updatedQuiz;
  };
  
  static deleteQuiz = async ({ quizId }) => {
    try {
      validateMongoDbId(quizId);
      // Find the quiz first to get the lessonId
      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new NotFoundError("Quiz not found");

      // Use the lessonId from the quiz to update the lesson
      const findCourse = await courseModel.findByIdAndUpdate(quiz.courseId, {
        quizzes: null,
      });

      const findQuiz = await Quiz.findByIdAndDelete(quizId);
      return findQuiz;
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
    } catch (error) {
      console.log(error);
    }
  };

  static uploadFileUserSubmit = async ({ filename, quizId }) => {
    validateMongoDbId(quizId);
    try {
      const findQuiz = await Quiz.findById(quizId);
      if (!findQuiz) {
        throw new NotFoundError("Quiz not found");
      }

      const result = await cloudinary.uploader.upload(filename, {
        resource_type: "raw",
      });
      const score = await Score.findOne({ quiz: quizId });
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
    } catch (error) {
      console.log(error);
    }
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
    try {
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

      if (!quizzes.length)
        throw new NotFoundError(
          "No quizzes found for the student in this course"
        );

      return quizzes;
    } catch (error) {
      console.error(error);
      throw new BadRequestError(
        "Failed to get quizzes by student and course",
        error
      );
    }
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
