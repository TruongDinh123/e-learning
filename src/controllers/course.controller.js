"use strict";

const { Created, SuccessReponse } = require("../core/success.reponse");
const { CourseService } = require("../services/course/course.service");

class CourseController {
  createCourse = async (req, res, next) => {
    const { name, title, categoryId } = req.body;
    const userId = req.headers["x-client-id"];
    new Created({
      message: "Course Created!",
      metadata: await CourseService.createCourse({
        name,
        title,
        userId,
        categoryId,
      }),
      options: {
        limit: 10,
      },
    }).send(res);
  };

  uploadImageCourse = async (req, res, next) => {
    const { courseId } = req.params;
    const { path: filename } = req.file;

    new SuccessReponse({
      message: "Upload image course successfully",
      metadata: await CourseService.uploadImageCourse({ courseId, filename }),
    }).send(res);
  };

  getCourses = async (req, res, next) => {
    new Created({
      message: "Success!",
      metadata: await CourseService.getCourse(),
      options: {
        limit: 10,
      },
    }).send(res);
  };

  selectCourse = async (req, res, next) => {
    new Created({
      message: "Success!",
      metadata: await CourseService.selectCourse(),
    }).send(res);
  };

  updateCourse = async (req, res, next) => {
    const { id } = req.params;
    const { name, title, categoryId } = req.body;

    return res
      .status(200)
      .json(await CourseService.updateCourse({ id, name, title, categoryId }));
  };

  getACourse = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.headers["x-client-id"];

    new SuccessReponse({
      message: "Get a course successfully!",
      metadata: await CourseService.getACourse({ id, userId }),
    }).send(res);
  };

  getACourseByInfo = async (req, res, next) => {
    const { id } = req.params;

    new SuccessReponse({
      message: "Get a course successfully!",
      metadata: await CourseService.getACourseByInfo({ id }),
    }).send(res);
  };

  deleteCourse = async (req, res, next) => {
    const { id } = req.params;
    return res.status(200).json({
      message: "Course Deleted!",
      metadata: await CourseService.deleteCourse(id),
    });
  };

  addStudentToCourse = async (req, res, next) => {
    const { courseId } = req.params;
    const { email } = req.body;
    const userId = req.headers["x-client-id"];

    new SuccessReponse({
      message: "Student added to course successfully!",
      metadata: await CourseService.addStudentToCours({
        courseId,
        email,
        userId,
      }),
    }).send(res);
  };

  addTeacherToCourse = async (req, res, next) => {
    const { courseId } = req.params;
    const { email } = req.body;

    new SuccessReponse({
      message: "Teacher added to course successfully!",
      metadata: await CourseService.addTeacherToCours({
        courseId,
        email,
      }),
    }).send(res);
  };

  updateCourseTeacher = async (req, res, next) => {
    const { courseId } = req.params;
    const { email } = req.body;

    new SuccessReponse({
      message: "Teacher added to course successfully!",
      metadata: await CourseService.updateCourseTeacher({
        courseId,
        email,
      }),
    }).send(res);
  };

  removeStudentFromCourse = async (req, res, next) => {
    const { courseId, userId } = req.params;

    new SuccessReponse({
      message: "Student removed from course successfully!",
      metadata: await CourseService.removeStudentFromCourse({
        courseId,
        userId,
      }),
    }).send(res);
  };

  getstudentCourses = async (req, res, next) => {
    const userId = req.headers["x-client-id"];

    new SuccessReponse({
      message: "Get student courses successfully!",
      metadata: await CourseService.getStudentCourses(userId),
    }).send(res);
  };

  getCourseCompletion = async (req, res, next) => {
    const { courseId } = req.params;
    const userId = req.headers["x-client-id"];

    new SuccessReponse({
      message: "Get course completion successfully!",
      metadata: await CourseService.getCourseCompletion({ courseId, userId }),
    }).send(res);
  };

  buttonShowCourse = async (req, res, next) => {
    const { courseId } = req.params;
    new SuccessReponse({
      message: "Get course public successfully!",
      metadata: await CourseService.buttonShowCourse(courseId),
    }).send(res);
  };

  buttonPrivateCourse = async (req, res, next) => {
    const { courseId } = req.params;
    new SuccessReponse({
      message: "Get course private successfully!",
      metadata: await CourseService.buttonPrivateCourse(courseId),
    }).send(res);
  };

  getCoursePublic = async (req, res, next) => {
    new SuccessReponse({
      message: "Get course private successfully!",
      metadata: await CourseService.getCoursePublic(),
    }).send(res);
  };

  createNotification = async (req, res, next) => {
    const { courseId } = req.params;
    const { message } = req.body;

    new SuccessReponse({
      message: "Create notification successfully",
      metadata: await CourseService.createNotification({
        courseId,
        message,
      }),
    }).send(res);
  };
}

module.exports = new CourseController();
