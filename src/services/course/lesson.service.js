const courseModel = require("../../models/course.model");
const lessonModel = require("../../models/lesson.model");
const validateMongoDbId = require("../../config/validateMongoDbId");

class lessonService {
  static createLesson = async ({ name, content, videoUrl, courseId }) => {
    try {
      const findCourse = await courseModel.findById(courseId);
      if (!findCourse) {
        throw new Error("Course not found");
      }

      const lesson = await lessonModel.create({
        name,
        content,
        videoUrl,
      });
      await lesson.save();

      findCourse.lessons.push(lesson);
      await findCourse.save();

      const updatedCourse = await courseModel
        .findById(courseId)
        .populate("lessons");

      return { lesson, findCourse: updatedCourse };
    } catch (error) {
      throw new Error("Failed to create lesson", error);
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
}

exports.lessonService = lessonService;
