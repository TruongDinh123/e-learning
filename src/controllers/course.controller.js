"use strict";

const { Created } = require("../core/success.reponse");
const { CourseService } = require("../services/course/course.service");

class CourseController {
  createCourse = async (req, res, next) => {
    new Created({
      message: "Course Created!",
      metadata: await CourseService.createCourse(req.body),
      options: {
        limit: 10,
      },
    }).send(res);
  };

  getCourses = async (req, res, next) => {
    return res.status(200).json(await CourseService.getCourse());
  };

  updateCourse = async (req, res, next) => {
    const { id } = req.params;
    const { name, title } = req.body;

    return res
      .status(200)
      .json(await CourseService.updateCourse({ id, name, title }));
  };

  deleteCourse = async (req, res, next) => {
    const { id } = req.params;
    try {
      const deleteCourse = await CourseService.deleteCourse({ id });

      return res.status(200).json({
        status: true,
        message: "Course Deleted!",
      });
    } catch (error) {
      throw new Error(error);
    }
  };
}

module.exports = new CourseController();
