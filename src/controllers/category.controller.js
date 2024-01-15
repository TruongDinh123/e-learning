const { Created, SuccessReponse } = require("../core/success.reponse");
const { CategoryService } = require("../services/course/categories.service");

class CategoryController {
  createCategoryAndSubCourse = async (req, res, next) => {
    const { name } = req.body;

    new Created({
      message: "Category have been created successfully",
      metadata: await CategoryService.createCategoryAndSubCourse(name),
    }).send(res);
  };

  deleteCategory = async (req, res, next) => {
    const { categoryId } = req.params;

    new SuccessReponse({
      message: "Category have been deleted successfully",
      metadata: await CategoryService.deleteCategory(categoryId),
    }).send(res);
  };

  updateCategory = async (req, res, next) => {
    const { categoryId } = req.params;
    const { categoryName } = req.body;

    new SuccessReponse({
      message: "Category have been updated successfully",
      metadata: await CategoryService.updateCategory(categoryId, categoryName),
    }).send(res);
  };

  getAllCategoryAndSubCoursesById = async (req, res, next) => {
    const { categoryId } = req.params;

    new SuccessReponse({
      message: "Get all categories successfully",
      metadata: await CategoryService.getAllCategoriesById(categoryId),
    }).send(res);
  };

  getAllCategoryAndSubCourses = async (req, res, next) => {
    new SuccessReponse({
      message: "Get all categories and subCourses successfully",
      metadata: await CategoryService.getAllCategories(),
    }).send(res);
  };

  getAllSubCoursesById = async (req, res, next) => {
    const { subCourseId } = req.params;

    new SuccessReponse({
      message: "Get all subCourses successfully",
      metadata: await CategoryService.getAllSubCoursesById(subCourseId),
    }).send(res);
  };

  getAllSubCourses = async (req, res, next) => {
    new SuccessReponse({
      message: "Get all subCourses successfully",
      metadata: await CategoryService.getAllSubCourses(),
    }).send(res);
  };
}

module.exports = new CategoryController();
