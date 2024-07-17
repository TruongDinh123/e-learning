'use strict';

const {SuccessReponse} = require('../core/success.reponse');
const {QuizService} = require('../services/course/quiz.service');
const UserService = require('../services/user.service');
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
      isTemplateMode,
      deletedQuestionIds,
    } = req.body;
    const userId = req.headers['x-client-id'];

    new SuccessReponse({
      message: 'Create quiz successfully',
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
        isTemplateMode,
        deletedQuestionIds,
      }),
    }).send(res);
  };

  saveDraftQuiz = async (req, res, next) => {
    const {
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
      deletedQuestionIds,
    } = req.body;

    console.log(req.body);
    const creatorId = req.headers['x-client-id'];

    new SuccessReponse({
      message: 'Create draft quiz successfully',
      metadata: await QuizService.saveDraftQuiz({
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
      }),
    }).send(res);
  };

  startQuiz = async (req, res, next) => {
    const {quizId} = req.params;
    const userId = req.headers['x-client-id'];
    new SuccessReponse({
      message: 'Start quiz successfully',
      metadata: await QuizService.startQuiz(quizId, userId),
    }).send(res);
  };

  getQuizs = async (req, res, next) => {
    new SuccessReponse({
      message: 'Get all quiz successfully',
      metadata: await QuizService.getQuizs(),
    }).send(res);
  };

  getdraftQuiz = async (req, res, next) => {
    const teacherId = req.headers['x-client-id'];
    new SuccessReponse({
      message: 'Get draft quiz successfully',
      metadata: await QuizService.getDraftQuiz({teacherId}),
    }).send(res);
  };

  deleteDraftQuiz = async (req, res, next) => {
    const {quizIdDraft} = req.params;
    new SuccessReponse({
      message: 'Delete quiz draft successfully',
      metadata: await QuizService.deleteDraftQuiz(quizIdDraft),
    }).send(res);
  };

  getAllQuizTemplates = async (req, res, next) => {
    new SuccessReponse({
      message: 'Get all quiz templates successfully',
      metadata: await QuizService.getAllQuizTemplates(),
    }).send(res);
  };

  deleteQuizTemplates = async (req, res, next) => {
    const {quizTemplateId} = req.params;

    new SuccessReponse({
      message: 'Delete quiz template successfully',
      metadata: await QuizService.deleteQuizTemplates(quizTemplateId),
    }).send(res);
  };

  uploadFileQuiz = async (req, res, next) => {
    const {quizId} = req.params;
    const {path: filename} = req.file;

    new SuccessReponse({
      message: 'Upload file successfully',
      metadata: await QuizService.uploadFile({quizId, filename}),
    }).send(res);
  };

  uploadFileUserSubmit = async (req, res, next) => {
    const {quizId} = req.params;
    const {path: filename} = req.file;
    const userId = req.headers['x-client-id'];

    new SuccessReponse({
      message: 'Upload file successfully',
      metadata: await QuizService.uploadFileUserSubmit({
        quizId,
        filename,
        userId,
      }),
    }).send(res);
  };

  getQuizsByCourse = async (req, res, next) => {
    const {courseIds} = req.params;

    new SuccessReponse({
      message: 'Get quizs successfully',
      metadata: await QuizService.getQuizsByCourse(courseIds),
    }).send(res);
  };

  getQuizsInfoByCourse = async (req, res, next) => {
    const {courseIds} = req.params;

    new SuccessReponse({
      message: 'Get quiz info successfully',
      metadata: await QuizService.getQuizsInfoByCourse(courseIds),
    }).send(res);
  };

  getQuizzesByStudentAndCourse = async (req, res, next) => {
    const {courseId} = req.params;
    const studentId = req.headers['x-client-id'];
    new SuccessReponse({
      message: 'Get quiz by student successfully',
      metadata: await QuizService.getQuizzesByStudentAndCourse(
        studentId,
        courseId
      ),
    }).send(res);
  };

  getAQuizByCourse = async (req, res, next) => {
    const {quizId} = req.params;

    new SuccessReponse({
      message: 'Get a quiz successfully',
      metadata: await QuizService.getAQuizByCourse(quizId),
    }).send(res);
  };

  getAQuizByCourseForUserScreen = async (req, res, next) => {

    new SuccessReponse({
      message: 'Get a quiz successfully',
      metadata: await QuizService.getAQuizByCourseForUserScreen(),
    }).send(res);
  };

  getAQuizTemplate = async (req, res, next) => {
    const {quizTemplateId} = req.params;

    new SuccessReponse({
      message: 'Get a quiz template successfully',
      metadata: await QuizService.getAQuizTemplate(quizTemplateId),
    }).send(res);
  };

  updateQuiz = async (req, res, next) => {
    const {quizId} = req.params;
    const {questions, name, submissionTime, essay, timeLimit} = req.body;

    new SuccessReponse({
      message: 'Cập nhật bài tập thành công',
      metadata: await QuizService.updateQuiz(quizId, {
        questions,
        name,
        submissionTime,
        essay,
        timeLimit,
      }),
    }).send(res);
  };

  updateQuizTimeSubmit = async (req, res, next) => {
    const {quizId} = req.params;
    const {submissionTime} = req.body;

    new SuccessReponse({
      message: 'Cập nhật thời gian nộp bài thành công!',
      metadata: await QuizService.updateQuizTimeSubmit({
        quizId,
        submissionTime,
      }),
    }).send(res);
  };

  updateQuizTemplate = async (req, res, next) => {
    const {quizTemplateId} = req.params;
    const {questions, name} = req.body;

    new SuccessReponse({
      message: 'Update quiz template successfully',
      metadata: await QuizService.updateQuizTemplate(quizTemplateId, {
        questions,
        name,
      }),
    }).send(res);
  };

  uploadQuestionImage = async (req, res, next) => {
    const {quizId, questionId, isTemplateMode} = req.body;
    const {path: filename} = req.file;
    console.log(req.body);

    new SuccessReponse({
      message: 'Upload image question successfully',
      metadata: await QuizService.uploadQuestionImage({
        quizId,
        filename,
        questionId,
        isTemplateMode,
      }),
    }).send(res);
  };

  deleteQuestionImage = async (req, res, next) => {
    const {quizId, questionId} = req.body;

    new SuccessReponse({
      message: 'Delete image question successfully',
      metadata: await QuizService.deleteQuestionImage(quizId, questionId),
    }).send(res);
  };

  deleteQuiz = async (req, res, next) => {
    const {quizId} = req.params;
    const userId = req.headers['x-client-id'];

    new SuccessReponse({
      message: 'Delete quiz successfully',
      metadata: await QuizService.deleteQuiz({quizId, userId}),
    }).send(res);
  };

  deleteScorebyQuiz = async (req, res, next) => {
    const {scoreId} = req.params;
    new SuccessReponse({
      message: 'Delete table score successfully',
      metadata: await QuizService.deleteScorebyQuiz({scoreId}),
    }).send(res);
  };

  deleteQuestion = async (req, res, next) => {
    const {quizId, questionId} = req.params;

    new SuccessReponse({
      message: 'Delete quiz successfully',
      metadata: await QuizService.deleteQuestion(quizId, questionId),
    }).send(res);
  };

  submitQuiz = async (req, res, next) => {
    try {
      const {quizId} = req.params;
      const {answer, predictAmount} = req.body;
      const userId = req.headers['x-client-id'];

      new SuccessReponse({
        message: 'Submit quiz successfully',
        metadata: await QuizService.submitQuiz(
          quizId,
          userId,
          answer,
          predictAmount,
        ),
      }).send(res);
    } catch (error) {}
  };

  submitQuizEssay = async (req, res, next) => {
    try {
      const {quizId} = req.params;
      const {essayAnswer} = req.body;
      const userId = req.headers['x-client-id'];

      new SuccessReponse({
        message: 'Submit quiz successfully',
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
      const userId = req.headers['x-client-id'];

      new SuccessReponse({
        message: 'Get score successfully',
        metadata: await QuizService.getScoreByUser(userId),
      }).send(res);
    } catch (error) {}
  };

  getScoreByInfo = async (req, res, next) => {
    try {
      const userId = req.headers['x-client-id'];

      new SuccessReponse({
        message: 'Get score info successfully',
        metadata: await QuizService.getScoreByInfo(userId),
      }).send(res);
    } catch (error) {}
  };

  getScoreByUserId = async (req, res, next) => {
    try {
      const {userId, quizId} = req.params;

      new SuccessReponse({
        message: 'Get score successfully',
        metadata: await QuizService.getScoreByUserId(userId, quizId),
      }).send(res);
    } catch (error) {}
  };

  getScoreByQuizId = async (req, res, next) => {
    try {
      const {quizId} = req.params;

      new SuccessReponse({
        message: 'Get score successfully',
        metadata: await QuizService.getScoreByQuizId(quizId),
      }).send(res);
    } catch (error) {}
  };

  getScoreHasUsersTested = async (req, res, next) => {
    try {
      new SuccessReponse({
        message: 'Get score successfully',
        metadata: await QuizService.getScoreHasUsersTested(),
      }).send(res);
    } catch (error) {}
  };

  getAllScoresByCourseId = async (req, res, next) => {
    const {courseId} = req.params;

    new SuccessReponse({
      message: 'get all scores by course successfully',
      metadata: await QuizService.getAllScoresByCourseId(courseId),
    }).send(res);
  };

  updateScore = async (req, res, next) => {
    try {
      const scoresToUpdate = req.body;

      new SuccessReponse({
        message: 'Update score successfully',
        metadata: await QuizService.updateScore(scoresToUpdate),
      }).send(res);
    } catch (error) {}
  };

  getSubmissionTimeActiveQuizByCourseId = async (req, res, next) => {
    const {courseId} = req.params;

    new SuccessReponse({
      message:
        'get submissionTime in the latest quizz by course ID successfully',
      metadata: await QuizService.getSubmissionTimeActiveQuizByCourseId(
        courseId
      ),
    }).send(res);
  };

  getInfoCommonScoreByUserId = async (req, res, next) => {
    const userId = req.headers['x-client-id'];

    new SuccessReponse({
      message: 'get info common in the latest quizz by userId ID successfully',
      metadata: await QuizService.getInfoCommonScoreByUserId(userId),
    }).send(res);
  };

  getTestCount = async (req, res, next) => {
    const {userId} = req.params;

    new SuccessReponse({
      message: 'get test count by userId',
      metadata: await UserService.getTestCount(userId),
    }).send(res);
  };

  activeQuizPresent = async (req, res, next) => {
    new SuccessReponse({
      message: "Update activeQuizPresent success!",
      metadata: await QuizService.activeQuizPresent(req.body),
    }).send(res);
  };

  getActiveQuizPresent = async (req, res, next) => {
    new SuccessReponse({
      message: 'get activeQuizPresent success!',
      metadata: await QuizService.getActiveQuizPresent(),
    }).send(res);
  };

  getAllQuizsNotDraft = async (req, res, next) => {
    new SuccessReponse({
      message: 'get getAllQuizsNotDraft success!',
      metadata: await QuizService.getAllQuizsNotDraft(),
    }).send(res);
  };

}

module.exports = new QuizController();
