"use strict";

const { SuccessReponse } = require("../core/success.reponse");
const { QuizService } = require("../services/course/quiz.service");

class QuizController {
  createQuiz = async (req, res, next) => {
    const { lessonId } = req.params;
    const { questions, name } = req.body;

    new SuccessReponse({
      message: "Create quiz successfully",
      metadata: await QuizService.createQuiz({ lessonId, questions, name }),
    }).send(res);
  };

  getQuizsByLesson = async (req, res, next) => {
    const { lessonId } = req.params;

    new SuccessReponse({
      message: "Get quizs successfully",
      metadata: await QuizService.getQuizsByLesson(lessonId),
    }).send(res);
  };

  updateQuiz = async (req, res, next) => {
    const { quizId } = req.params;
    const { questions, name } = req.body;

    new SuccessReponse({
      message: "Update quiz successfully",
      metadata: await QuizService.updateQuiz(quizId, { questions, name }),
    }).send(res);
  };

  deleteQuiz = async (req, res, next) => {
    const { quizId } = req.params;

    new SuccessReponse({
      message: "Delete quiz successfully",
      metadata: await QuizService.deleteQuiz({ quizId }),
    }).send(res);
  };

  deleteQuestion = async (req, res, next) => {
    const { quizId, questionId } = req.params;

    new SuccessReponse({
      message: "Delete quiz successfully",
      metadata: await QuizService.deleteQuestion(quizId, questionId),
    }).send(res);
  };

  submitQuiz = async (req, res, next) => {
    try {
      const { quizId } = req.params;
      const { answer } = req.body;
      const userId = req.headers["x-client-id"];

      new SuccessReponse({
        message: "Submit quiz successfully",
        metadata: await QuizService.submitQuiz(quizId, userId, answer),
      }).send(res);
    } catch (error) {
      console.log(error);
    }
  };

  getScoreByUser = async (req, res, next) => {
    try {
      const userId = req.headers["x-client-id"];

      new SuccessReponse({
        message: "Get score successfully",
        metadata: await QuizService.getScoreByUser(userId),
      }).send(res);
    } catch (error) {
      console.log(error);
    }
  };

  getScoreByUserId = async (req, res, next) => {
    try {
      const { userId, quizId } = req.params;

      new SuccessReponse({
        message: "Get score successfully",
        metadata: await QuizService.getScoreByUserId(userId, quizId),
      }).send(res);
    } catch (error) {
      console.log(error);
    }
  };
}

module.exports = new QuizController();
