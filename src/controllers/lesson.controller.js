"use strict";

const { BadRequestError } = require("../core/error.response");
const { lessonService } = require("../services/course/lesson.service");

class LessonController {
  createLesson = async (req, res, next) => {
    try {
      const { name, content, videoUrl } = req.body;
      const { courseId } = req.params;

      const result = await lessonService.createLesson({
        name,
        content,
        videoUrl,
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

      const result = await lessonService.getAllCourseLeesion({ courseId });

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
      const result = await lessonService.getALession({ lessonId });

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
      await lessonService.deleteLesson({ courseId, lessonId });

      return res.status(200).json({
        status: true,
        message: "Lesson Deleted!",
      });
    } catch (error) {
      throw new BadRequestError(error);
    }
  };
}

module.exports = new LessonController();
