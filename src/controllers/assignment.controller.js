const { SuccessReponse } = require("../core/success.reponse");
const { AssignmentService } = require("../services/course/assignments.service");

class AssignmentController {
  createAssignment = async (req, res, next) => {
    const { courseId, name, description, questions, timeLimit } = req.body;
    new SuccessReponse({
      message: "Create assignment successfully",
      metadata: await AssignmentService.createAssignment({
        courseId,
        name,
        description,
        questions,
        timeLimit,
      }),
    }).send(res);
  };

  getAssignmentByCourseId = async (req, res, next) => {
    const { courseId } = req.params;

    new SuccessReponse({
      message: "Get assignment successfully",
      metadata: await AssignmentService.getAssignmentsByCourse(courseId),
    }).send(res);
  };

  getAAssignment = async (req, res, next) => {
    const { id } = req.params;

    new SuccessReponse({
      message: "Get assignment successfully",
      metadata: await AssignmentService.getAAssignment(id),
    }).send(res);
  };

  submitAssignment = async (req, res, next) => {
    try {
      const { assignmentId } = req.params;
      const { answer, timeLimit } = req.body;
      const userId = req.headers["x-client-id"];

      new SuccessReponse({
        message: "Submit assignment successfully",
        metadata: await AssignmentService.submitAssignment(
          assignmentId,
          userId,
          answer,
          timeLimit
        ),
      }).send(res);
    } catch (error) {
      console.log(error);
    }
  };
}

module.exports = new AssignmentController();
