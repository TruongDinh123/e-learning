"use strict";
const { NotFoundError } = require("../../core/error.response");
const lessonModel = require("../../models/lesson.model");
const Quiz = require("../../models/quiz.model");
const Score = require("../../models/score.model");

class QuizService {
  static createQuiz = async ({ lessonId, name, questions }) => {
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

  static getQuizsByLesson = async (lessonId) => {
    try {
      const quizs = await Quiz.find()
        .where({ lessonId: lessonId })
        .populate("questions")
        .lean();

      if (!quizs) throw new NotFoundError("quizs not found");
      console.log("🚀 ~ quizs:", quizs);

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
      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new NotFoundError("no quiz found");

      let score = 0;
      const maxScore = 10; // Điểm số tối đa

      for (let i = 0; i < quiz.questions.length; i++) {
        if (quiz.questions[i].answer === answer[i]) {
          score++;
        }
      }

      const userScore = new Score({
        user: userId,
        quiz: quizId,
        score: ((score / quiz.questions.length) * maxScore).toFixed(2),
      });
      await userScore.save();

      return userScore;
    } catch (error) {
      console.log(error);
    }
  };
}

exports.QuizService = QuizService;
