"use strict";

const { BadRequestError } = require("../core/error.response");
const { SuccessReponse, OK } = require("../core/success.reponse");
const { LessonService } = require("../services/course/lesson.service");

class LessonController {
  createLesson = async (req, res, next) => {
    try {
      const { name, content } = req.body;
      const { courseId } = req.params;

      new SuccessReponse({
        message: "Lesson created!",
        metadata: await LessonService.createLesson({
          name,
          content,
          courseId,
        }),
      }).send(res);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getAllCourseLeesion = async (req, res, next) => {
    try {
      const { courseId } = req.params;
      const userId = req.headers["x-client-id"];

      new SuccessReponse({
        message: "Get all lesson successfully!",
        metadata: await LessonService.getAllCourseLeesion({ courseId, userId }),
      }).send(res);
    } catch (error) {
      throw new BadRequestError(error);
    }
  };
  
  getALession = async (req, res, next) => {
    const { lessonId } = req.params;

    try {
      new SuccessReponse({
        message: "Get a lesson successfully!",
        metadata: await LessonService.getALession({ lessonId }),
      }).send(res);
    } catch (error) {
      throw new BadRequestError(error);
    }
  };

  deleteALesson = async (req, res, next) => {
    const { courseId, lessonId } = req.params;

    try {
      new OK({
        message: "Delete lesson successfully!",
        metadata: await LessonService.deleteLesson({ courseId, lessonId }),
      }).send(res);
    } catch (error) {
      throw new BadRequestError(error);
    }
  };

  updateLesson = async (req, res, next) => {
    const { lessonId } = req.params;
    const { name, content, videoUrl } = req.body;
    new SuccessReponse({
      message: "Lesson Updated!",
      metadata: await LessonService.updateLesson({
        lessonId,
        name,
        content,
        videoUrl,
      }),
    }).send(res);
  };

  completeLesson = async (req, res, next) => {
    const { lessonId } = req.params;
    const userId = req.headers["x-client-id"];

    new SuccessReponse({
      message: "Lesson Complete!",
      metadata: await LessonService.completeLesson({
        lessonId,
        userId,
      }),
    }).send(res);
  }
}

module.exports = new LessonController();
