"use strict";

const { SuccessReponse, OK } = require("../core/success.reponse");
const VideoLessonService = require("../services/course/video-lesson.service");


class VideoLessonController {
  createVdLesson = async (req, res, next) => {
    const { lessonId } = req.params;
    const { path: filename } = req.file;
    new SuccessReponse({
      message: "Video Lesson Created!",
      metadata: await VideoLessonService.createVdLesson({
        filename,
        lessonId,
      }),
      options: {
        limit: 10,
      },
    }).send(res);
  };

  deleteVdLesson = async (req, res, next) => {
    const { lessonId, videoLessonId } = req.params;

    new OK({
      message: "Video Lesson Deleted!",
      metadata: await VideoLessonService.deleteVdLesson(
        lessonId,
        videoLessonId
      ),
    }).send(res);
  };
}

module.exports = new VideoLessonController();
