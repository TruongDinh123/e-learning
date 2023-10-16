const courseModel = require("../../models/course.model");

class CourseService {
  static createCourse = async ({ name, title }) => {
    try {
      const course = await courseModel.create({ name, title });
      const createCourse = course.save();

      return createCourse;
    } catch (error) {
      throw new Error("Failed to create course", error);
    }
  };

  static getCourse = async () => {
    try {
      const courses = await courseModel.find();

      if (!courses) throw new Error("Failed to get courses");
      return courses;
    } catch (error) {
      console.log("eror Courses::", error);
    }
  };

  static updateCourse = async ({ id, name, title }) => {
    try {
      const course = await courseModel.findById(id);

      if (!course) throw new Error("Course not found");

      course.name = name;
      course.title = title;

      const updateCourse = await course.save();

      return updateCourse;
    } catch (error) {
      throw new Error("Failed to update course", error);
    }
  };

  static deleteCourse = async ({ id }) => {
    try {
      const course = await courseModel.findByIdAndDelete(id);
      if (!course) throw new Error("Course not found");
    } catch (error) {
      throw new Error(error);
    }
  };
}

module.exports = {
  CourseService,
};
