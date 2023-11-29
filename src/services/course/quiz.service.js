"use strict";
const validateMongoDbId = require("../../config/validateMongoDbId");
const { NotFoundError, BadRequestError } = require("../../core/error.response");
const lessonModel = require("../../models/lesson.model");
const Quiz = require("../../models/quiz.model");
const Score = require("../../models/score.model");

class QuizService {
  static createQuiz = async ({ lessonId, name, questions }) => {
    const existingQuiz = await Quiz.findOne({ lessonId });
    if (existingQuiz) {
      throw new BadRequestError(`Quiz ${name} already exists`);
    }

    const formattedQuestions = [];

    for (const question of questions) {
      const formattedQuestion = {
        question: question.question,
        options: question.options,
        answer: question.answer,
      };
      formattedQuestions.push(formattedQuestion);
    }

    const quiz = new Quiz({ name, lessonId, questions: formattedQuestions });
    const savedQuiz = await quiz.save();

    const lesson = await lessonModel
      .findByIdAndUpdate(
        lessonId,
        {
          quiz: savedQuiz,
        },
        { new: true }
      )
      .populate("quiz");

    if (!lesson) throw new NotFoundError("lesson not found");

    return lesson;
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

  static getQuizsByLesson = async (lessonId) => {
    try {
      const quizs = await Quiz.find()
        .where({ lessonId: lessonId })
        .populate("questions")
        .lean();

      if (!quizs) throw new NotFoundError("quizs not found");

      return quizs;
    } catch (error) {
      throw new BadRequestError("Failed to get quizs", error);
    }
  };

  static updateQuiz = async (quizId, updatedQuizData) => {
    const { name, questions } = updatedQuizData;

    const formattedQuestions = questions.map((question) => ({
      question: question.question,
      options: question.options,
      answer: question.answer,
    }));

    const quiz = await Quiz.findById(quizId);

    if (!quiz) throw new NotFoundError("quiz not found");

    quiz.name = name;
    quiz.questions.push(...formattedQuestions);

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
      const findLesson = await lessonModel.findByIdAndUpdate(quiz.lessonId, {
        quiz: null,
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
        await existingScore.save();
        return existingScore;
      } else {
        const userScore = new Score({
          user: userId,
          quiz: quizId,
          score: ((score / quiz.questions.length) * maxScore).toFixed(2),
          answers: answer,
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
}

exports.QuizService = QuizService;
