const { NotFoundError, BadRequestError } = require("../../core/error.response");
const lessonModel = require("../../models/lesson.model");
const validateMongoDbId = require("../../config/validateMongoDbId");
const videoLessonModel = require("../../models/video-lesson.model");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: "dvsvd87sm",
  api_key: "243392977754277",
  api_secret: "YnSIAsvn7hRPqxTdIQBX9gBzihE",
});

class VideoLessonService {
  static createVdLesson = async ({ filename, lessonId }) => {
    validateMongoDbId(lessonId);
    try {
      const findLesson = await lessonModel.findById(lessonId);
      if (!findLesson) {
        throw new NotFoundError("Lesson not found");
      }

      const result = await cloudinary.uploader.upload(filename, {
        resource_type: "video",
      });
      const videoLesson = await videoLessonModel.create({
        filename: result.public_id,
        url: result.secure_url,
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

      const publicId = findVideoLesson.filename;
      console.log("publicId::", publicId);
      const result = await cloudinary.uploader.destroy(publicId,{ resource_type: "video"});

      console.log("Deleted video from Cloudinary:", result);
    } catch (error) {
      throw new BadRequestError(error);
    }
  };
}

module.exports = VideoLessonService;
