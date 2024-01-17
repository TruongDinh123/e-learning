"use strict";

const categoryModel = require("../../models/category.model");
const courseModel = require("../../models/course.model");
const { convertToObjectIdMongodb } = require("../../utils/index");

class CategoryService {
  static createCategoryAndSubCourse = async (name) => {
    // Tạo một Category mới
    const category = new categoryModel({
      name: name,
    });

    // Lưu Category vào database
    await category.save();

    // // Tạo và lưu các SubCourse
    // for (let i = 0; i < subCourses.length; i++) {
    //   const subCourse = new subCourseModel({
    //     name: subCourses[i].name,
    //     courses: subCourses[i].courses,
    //     category: category._id,
    //   });

    //   // Lưu SubCourse vào database
    //   await subCourse.save();

    //   // Thêm SubCourse vào Category
    //   category.subCourses.push(subCourse._id);
    // }

    // Cập nhật Category trong database
    await category.save();
  };

  static getAllCategoriesById = async (categoryId) => {
    if (categoryId) {
      return await categoryModel
        .findById(categoryId)
        .populate({
          path: "courses",
          select: "name title image_url teacher lesson -_id",
        })
        .lean();
    }
    return await categoryModel.find().populate({
      path: "courses",
      select: "name title image_url teacher lesson -_id",
    });
  };

  static getAllCategories = async () => {
    const categories = await categoryModel
      .find()
      .populate({
        path: "courses",
        select: "name title image_url teacher lessons showCourse _id",
      })
      .lean();
    return categories;
  };

  static updateCategory = async (categoryId, categoryName) => {
    try {
      const category = await categoryModel.findById(categoryId);
      if (category) {
        category.name = categoryName;
        await category.save();
      }
    } catch (error) {
      console.log("🚀 ~ error:", error);
    }
  };

  static deleteCategory = async (categoryId) => {
    const category = await categoryModel.findById(categoryId);
    if (category) {
      await courseModel.updateMany(
        {
          category: convertToObjectIdMongodb(categoryId),
        },
        { $unset: { category: "" } }
      );
      await categoryModel.findByIdAndDelete(categoryId);
    }
  };

  //sub-course
  static getAllSubCoursesById = async (subCourseId) => {
    if (subCourseId) {
      return await subCourseModel
        .findById(subCourseId)
        .populate({
          path: "courses",
          select: "name title image_url teacher -_id",
        })
        .lean();
    }
    return await subCourseModel.find().populate({
      path: "courses",
      select: "name title image_url teacher -_id",
    });
  };

  static getAllSubCourses = async () => {
    const subCourses = await subCourseModel
      .find()
      .populate({
        path: "courses",
        select: "name title image_url teacher -_id",
      })
      .lean();
    return subCourses;
  };
}

module.exports = {
  CategoryService,
};
