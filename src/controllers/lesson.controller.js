"use strict";

const { BadRequestError } = require("../core/error.response");
const { SuccessReponse } = require("../core/success.reponse");
const { LessonService } = require("../services/course/lesson.service");

class LessonController {
  createLesson = async (req, res, next) => {
    try {
      const { name, content } = req.body;
      const { courseId } = req.params;

      const result = await LessonService.createLesson({
        name,
        content,
        courseId,
      });

      return res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getAllCourseLeesion = async (req, res, next) => {
    try {
      const { courseId } = req.params;

      const result = await LessonService.getAllCourseLeesion({ courseId });

      return res.status(200).json({
        status: true,
        message: "Get all lesson successfully!",
        result,
      });
    } catch (error) {
      throw new BadRequestError(error);
    }
  };

  getALession = async (req, res, next) => {
    const { lessonId } = req.params;

    try {
      const result = await LessonService.getALession({ lessonId });

      return res.status(200).json({
        status: true,
        message: "Get a lesson successfully!",
        result,
      });
    } catch (error) {
      throw new BadRequestError(error);
    }
  };

  deleteALesson = async (req, res, next) => {
    const { courseId, lessonId } = req.params;

    try {
      await LessonService.deleteLesson({ courseId, lessonId });

      return res.status(200).json({
        status: true,
        message: "Lesson Deleted!",
      });
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
}

module.exports = new LessonController();
