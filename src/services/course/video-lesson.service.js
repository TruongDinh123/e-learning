const { NotFoundError, BadRequestError } = require("../../core/error.response");
const lessonModel = require("../../models/lesson.model");
const validateMongoDbId = require("../../config/validateMongoDbId");
const videoLessonModel = require("../../models/video-lesson.model");
const { v4: uuidv4 } = require("uuid");

class VideoLessonService {
  static createVdLesson = async ({ filename, lessonId }) => {
    validateMongoDbId(lessonId);
    try {
      const findLesson = await lessonModel.findById(lessonId);
      if (!findLesson) {
        throw new NotFoundError("Lesson not found");
      }

      const videoLesson = await videoLessonModel.create({
        filename: uuidv4(filename),
        url: "uploads/" + uuidv4(filename),
        lesson: lessonId,
      });
      await videoLesson.save();

      findLesson.videos.push(videoLesson);
      await findLesson.save();

      const updateVdLesson = await lessonModel
        .findById(lessonId)
        .populate("videos");

      return { videoLesson, findLesson: updateVdLesson };
    } catch (error) {
      throw new BadRequestError(error);
    }
  };

  static deleteVdLesson = async (lessonId, videoLessonId) => {
    validateMongoDbId(lessonId);
    validateMongoDbId(videoLessonId);
    try {
      const findLesson = await lessonModel.findByIdAndUpdate(lessonId, {
        $pull: { videos: videoLessonId },
      });

      if (!findLesson) {
        throw new NotFoundError("Lesson not found");
      }

      const findVideoLesson = await videoLessonModel.findByIdAndDelete(
        videoLessonId
      );
      
      if (!findVideoLesson) {
        throw new NotFoundError("Video Lesson not found");
      }
    } catch (error) {
      throw new BadRequestError(error);
    }
  };
}

module.exports = VideoLessonService;
