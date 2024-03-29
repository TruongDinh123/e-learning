"use strict";

const { SuccessReponse } = require("../core/success.reponse");
const { QuizService } = require("../services/course/quiz.service");

class QuizController {
  createQuiz = async (req, res, next) => {
    const {
      type,
      courseIds,
      studentIds,
      essay,
      questions,
      name,
      submissionTime,
      quizTemplateId,
      lessonId,
      timeLimit,
    } = req.body;

    const userId = req.headers["x-client-id"];

    new SuccessReponse({
      message: "Create quiz successfully",
      metadata: await QuizService.createQuiz({
        type,
        courseIds,
        studentIds,
        essay,
        questions,
        name,
        submissionTime,
        quizTemplateId,
        lessonId,
        timeLimit,
        userId,
      }),
    }).send(res);
  };

  startQuiz = async (req, res, next) => {
    const { quizId } = req.params;
    const userId = req.headers["x-client-id"];
    new SuccessReponse({
      message: "Start quiz successfully",
      metadata: await QuizService.startQuiz(quizId, userId),
    }).send(res);
  };

  getQuizs = async (req, res, next) => {
    new SuccessReponse({
      message: "Get all quiz successfully",
      metadata: await QuizService.getQuizs(),
    }).send(res);
  };

  getAllQuizTemplates = async (req, res, next) => {
    new SuccessReponse({
      message: "Get all quiz templates successfully",
      metadata: await QuizService.getAllQuizTemplates(),
    }).send(res);
  };

  deleteQuizTemplates = async (req, res, next) => {
    const { quizTemplateId } = req.params;

    new SuccessReponse({
      message: "Delete quiz template successfully",
      metadata: await QuizService.deleteQuizTemplates(quizTemplateId),
    }).send(res);
  };

  uploadFileQuiz = async (req, res, next) => {
    const { quizId } = req.params;
    const { path: filename } = req.file;

    new SuccessReponse({
      message: "Upload file successfully",
      metadata: await QuizService.uploadFile({ quizId, filename }),
    }).send(res);
  };

  uploadFileUserSubmit = async (req, res, next) => {
    const { quizId } = req.params;
    const { path: filename } = req.file;
    const userId = req.headers["x-client-id"];

    new SuccessReponse({
      message: "Upload file successfully",
      metadata: await QuizService.uploadFileUserSubmit({
        quizId,
        filename,
        userId,
      }),
    }).send(res);
  };

  getQuizsByCourse = async (req, res, next) => {
    const { courseIds } = req.params;

    new SuccessReponse({
      message: "Get quizs successfully",
      metadata: await QuizService.getQuizsByCourse(courseIds),
    }).send(res);
  };

  getQuizsInfoByCourse = async (req, res, next) => {
    const { courseIds } = req.params;

    new SuccessReponse({
      message: "Get quiz info successfully",
      metadata: await QuizService.getQuizsInfoByCourse(courseIds),
    }).send(res);
  };

  getQuizzesByStudentAndCourse = async (req, res, next) => {
    const { courseId } = req.params;
    const studentId = req.headers["x-client-id"];
    new SuccessReponse({
      message: "Get quiz by student successfully",
      metadata: await QuizService.getQuizzesByStudentAndCourse(
        studentId,
        courseId
      ),
    }).send(res);
  };

  getAQuizByCourse = async (req, res, next) => {
    const { quizId } = req.params;

    new SuccessReponse({
      message: "Get a quiz successfully",
      metadata: await QuizService.getAQuizByCourse(quizId),
    }).send(res);
  };

  getAQuizTemplate = async (req, res, next) => {
    const { quizTemplateId } = req.params;

    new SuccessReponse({
      message: "Get a quiz template successfully",
      metadata: await QuizService.getAQuizTemplate(quizTemplateId),
    }).send(res);
  };

  updateQuiz = async (req, res, next) => {
    const { quizId } = req.params;
    const { questions, name, submissionTime, essay, timeLimit } = req.body;

    new SuccessReponse({
      message: "Cập nhật bài tập thành công",
      metadata: await QuizService.updateQuiz(quizId, {
        questions,
        name,
        submissionTime,
        essay,
        timeLimit,
      }),
    }).send(res);
  };

  updateQuizTemplate = async (req, res, next) => {
    const { quizTemplateId } = req.params;
    const { questions, name } = req.body;

    new SuccessReponse({
      message: "Update quiz template successfully",
      metadata: await QuizService.updateQuizTemplate(quizTemplateId, {
        questions,
        name,
      }),
    }).send(res);
  };

  uploadQuestionImage = async (req, res, next) => {
    const { quizId, questionId } = req.body;
    const { path: filename } = req.file;

    new SuccessReponse({
      message: "Upload image question successfully",
      metadata: await QuizService.uploadQuestionImage({
        quizId,
        filename,
        questionId,
      }),
    }).send(res);
  };

  deleteQuiz = async (req, res, next) => {
    const { quizId } = req.params;
    const userId = req.headers["x-client-id"];

    new SuccessReponse({
      message: "Delete quiz successfully",
      metadata: await QuizService.deleteQuiz({ quizId, userId }),
    }).send(res);
  };

  deleteScorebyQuiz = async (req, res, next) => {
    const { scoreId } = req.params;
    new SuccessReponse({
      message: "Delete table score successfully",
      metadata: await QuizService.deleteScorebyQuiz({ scoreId }),
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
    } catch (error) {}
  };

  submitQuizEssay = async (req, res, next) => {
    try {
      const { quizId } = req.params;
      const { essayAnswer } = req.body;
      const userId = req.headers["x-client-id"];

      new SuccessReponse({
        message: "Submit quiz successfully",
        metadata: await QuizService.submitQuizEssay({
          quizId,
          userId,
          essayAnswer,
        }),
      }).send(res);
    } catch (error) {}
  };

  getScoreByUser = async (req, res, next) => {
    try {
      const userId = req.headers["x-client-id"];

      new SuccessReponse({
        message: "Get score successfully",
        metadata: await QuizService.getScoreByUser(userId),
      }).send(res);
    } catch (error) {}
  };

  getScoreByInfo = async (req, res, next) => {
    try {
      const userId = req.headers["x-client-id"];

      new SuccessReponse({
        message: "Get score info successfully",
        metadata: await QuizService.getScoreByInfo(userId),
      }).send(res);
    } catch (error) {}
  };

  getScoreByUserId = async (req, res, next) => {
    try {
      const { userId, quizId } = req.params;

      new SuccessReponse({
        message: "Get score successfully",
        metadata: await QuizService.getScoreByUserId(userId, quizId),
      }).send(res);
    } catch (error) {}
  };

  getScoreByQuizId = async (req, res, next) => {
    try {
      const { quizId } = req.params;

      new SuccessReponse({
        message: "Get score successfully",
        metadata: await QuizService.getScoreByQuizId(quizId),
      }).send(res);
    } catch (error) {}
  };

  getAllScoresByCourseId = async (req, res, next) => {
      const { courseId } = req.params;

      new SuccessReponse({
        message: "get all scores by course successfully",
        metadata: await QuizService.getAllScoresByCourseId(courseId),
      }).send(res);
  };

  updateScore = async (req, res, next) => {
    try {
      const scoresToUpdate = req.body;

      new SuccessReponse({
        message: "Update score successfully",
        metadata: await QuizService.updateScore(scoresToUpdate),
      }).send(res);
    } catch (error) {}
  };
}

module.exports = new QuizController();
