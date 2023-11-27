"use strict";

const assignmentModel = require("../../models/assignment.model");
const courseModel = require("../../models/course.model");
const Score = require("../../models/score.model");
const { NotFoundError, BadRequestError } = require("../../core/error.response");

class AssignmentService {
  static createAssignment = async ({
    courseId,
    name,
    description,
    timeLimit,
    questions,
  }) => {
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

  static submitAssignment = async (assignmentId, userId, answer, timeLimit) => {
    try {
      let score = 0;
      const maxScore = 10;

      const assignment = await assignmentModel.findById(assignmentId);

      if (!assignment) throw new NotFoundError("assignment not found");

      if (
        timeLimit &&
        new Date() - assignment.createdAt > timeLimit * 60 * 1000
      ) {
        throw new BadRequestError("Time limit exceeded");
      }

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
