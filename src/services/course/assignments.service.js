"use strict";

const assignmentModel = require("../../models/assignment.model");
const courseModel = require("../../models/course.model");
const Score = require("../../models/score.model");
const { NotFoundError, BadRequestError } = require("../../core/error.response");
const validateMongoDbId = require("../../config/validateMongoDbId");

class AssignmentService {
  static createAssignment = async ({
    courseId,
    name,
    description,
    timeLimit,
    questions,
  }) => {
    const existingAssignment = await assignmentModel.findOne({ courseId });
    if (existingAssignment) {
      throw new BadRequestError(`Assignment ${name} already exists`);
    }
    const formattedQuestions = [];
    for (const question of questions) {
      const formattedQuestion = {
        question: question.question,
        options: question.options,
        answer: question.answer,
      };
      formattedQuestions.push(formattedQuestion);
    }
    const assignment = new assignmentModel({
      courseId,
      name,
      description,
      questions: formattedQuestions,
      timeLimit,
    });
    const savedAssignment = await assignment.save();

    const Course = await courseModel
      .findByIdAndUpdate(
        courseId,
        {
          assignment: savedAssignment,
        },
        { new: true }
      )
      .populate("assignment");

    if (!Course) throw new NotFoundError("Course not found");

    return Course;
  };

  static getAllAssignments = async () => {
    try {
      const assignments = await assignmentModel.find().lean();

      if (!assignments) throw new NotFoundError("assignments not found");

      return assignments;
    } catch (error) {
      throw new BadRequestError("Failed to get assignments", error);
    }
  };

  static getAAssignment = async (id) => {
    validateMongoDbId(id);
    try {
      const assignment = await assignmentModel.findOne({ _id: id }).lean();

      return assignment;
    } catch (error) {
      throw new BadRequestError("Failed to get a assignment", error);
    }
  };

  static getAssignmentsByCourse = async (courseId) => {
    try {
      const assignments = await assignmentModel
        .find()
        .where({ courseId: courseId })
        .lean();

      if (!assignments) throw new NotFoundError("assignments not found");

      return assignments;
    } catch (error) {
      throw new BadRequestError("Failed to get assignments", error);
    }
  };

  static deleteQuestionAssignment = async (assignmentId, questionId) => {
    try {
      const assignment = await assignmentModel.findById(assignmentId);
      if (!assignment) throw new NotFoundError("assignment not found");

      const questionExists = assignment.questions.some(
        (question) => question._id.toString() === questionId
      );

      if (!questionExists) throw new NotFoundError("question not found");

      assignment.questions = assignment.questions.filter(
        (question) => question._id.toString() !== questionId
      );

      if (assignment.questions.length === 0) {
        await assignmentModel.findByIdAndDelete(assignmentId);
      } else {
        await assignment.save();
      }

      return assignment;
    } catch (error) {
      throw new BadRequestError("Failed to delete question", error);
    }
  };

  static deleteAssignment = async ({ assignmentId }) => {
    try {
      validateMongoDbId(assignmentId);

      const assignment = await assignmentModel.findById(assignmentId);
      if (!assignment) throw new NotFoundError("Assignment not found");

      const findCourse = await courseModel.findByIdAndUpdate(
        assignment.courseId,
        {
          assignment: null,
        }
      );

      const findAssignment = await assignmentModel.findByIdAndDelete(
        assignmentId
      );
      return findAssignment;
    } catch (error) {
      throw new BadRequestError("Failed to delete assignment", error);
    }
  };

  // static updateAssignment = async (assignmentId, updatedQuizData) => {
  //   const { name, questions } = updatedQuizData;

  //   const formattedQuestions = questions.map((question) => ({
  //     question: question.question,
  //     options: question.options,
  //     answer: question.answer,
  //   }));

  //   const assignment = await assignmentModel.findById(assignmentId);

  //   if (!assignment) throw new NotFoundError("assignment not found");

  //   assignment.name = name;
  //   assignment.questions.push(...formattedQuestions);

  //   const updatedAssignment = await assignment.save();

  //   return updatedAssignment;
  // };

  static updateAssignment = async (assignmentId, updatedQuizData) => {
    const { name, questions } = updatedQuizData;
  
    const assignment = await assignmentModel.findById(assignmentId);
  
    if (!assignment) throw new NotFoundError("assignment not found");
  
    assignment.name = name;
  
    for (const updatedQuestion of questions) {
      const questionIndex = assignment.questions.findIndex(
        (question) => question._id.toString() === updatedQuestion._id
      );
  
      if (questionIndex !== -1) {
        // Update existing question
        assignment.questions[questionIndex] = updatedQuestion;
      } else {
        // Add new question
        assignment.questions.push(updatedQuestion);
      }
    }
  
    const updatedAssignment = await assignment.save();
  
    return updatedAssignment;
  };

  static submitAssignment = async (assignmentId, userId, answer, timeLimit) => {
    try {
      let score = 0;
      const maxScore = 10;

      const assignment = await assignmentModel.findById(assignmentId);

      if (!assignment) throw new NotFoundError("assignment not found");

      for (let i = 0; i < assignment.questions.length; i++) {
        const question = assignment.questions[i];
        const userAnswer = answer[i][Object.keys(answer[i])[0]];

        if (question.answer === userAnswer) {
          score++;
        }
      }

      const userScore = new Score({
        user: userId,
        assignment: assignmentId,
        score: ((score / assignment.questions.length) * maxScore).toFixed(2),
        answers: answer,
        timeLimit: timeLimit,
        isComplete: true,
      });
      await userScore.save();

      return userScore;
    } catch (error) {
      throw new BadRequestError("Failed to submit assignment", error);
    }
  };
}

exports.AssignmentService = AssignmentService;
