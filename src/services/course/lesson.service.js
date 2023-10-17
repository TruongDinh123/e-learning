const courseModel = require("../../models/course.model");
const lessonModel = require("../../models/lesson.model");
const validateMongoDbId = require("../../config/validateMongoDbId");
const { NotFoundError, BadRequestError } = require("../../core/error.response");

class LessonService {
  static createLesson = async ({ name, content, courseId }) => {
    try {
      const findCourse = await courseModel.findById(courseId);
      if (!findCourse) {
        throw new NotFoundError("Course not found");
      }

      const lesson = await lessonModel.create({
        name,
        content,
      });
      await lesson.save();

      findCourse.lessons.push(lesson);
      await findCourse.save();

      const updatedCourse = await courseModel
        .findById(courseId)
        .populate("lessons");

      return { lesson, findCourse: updatedCourse };
    } catch (error) {
      throw new BadRequestError("Failed to create lesson", error);
    }
  };

  static getAllCourseLeesion = async ({ courseId }) => {
    try {
      const lessons = await courseModel
        .find()
        .where({ _id: courseId })
        .select("lessons")
        .populate("lessons");

      return lessons;
    } catch (error) {
      throw new Error("Failed to get all lesson", error);
    }
  };

  static getALession = async ({ lessonId }) => {
    validateMongoDbId(lessonId);
    try {
      const lesson = await lessonModel.findOne({
        _id: lessonId,
      });
      return lesson;
    } catch (error) {
      throw new Error("Failed to get a lesson", error);
    }
  };

  static deleteLesson = async ({ courseId, lessonId }) => {
    try {
      validateMongoDbId(courseId);
      validateMongoDbId(lessonId);
      const findCourse = await courseModel.findByIdAndUpdate(courseId, {
        $pull: { lessons: lessonId },
      });

      const findLesson = await lessonModel.findByIdAndDelete(lessonId);
    } catch (error) {}
  };

  static updateLesson = async ({ lessonId, name, content, videoUrl }) => {
    validateMongoDbId(lessonId);
    try {
      const lesson = await lessonModel.findById(lessonId);
      lesson.name = name;
      lesson.content = content;
      lesson.videoUrl = videoUrl;

      const updateLesson = await lesson.save();
      return updateLesson;
    } catch (error) {
      throw new BadRequestError("Failed to update lesson", error);
    }
  };
}

exports.LessonService = LessonService;
