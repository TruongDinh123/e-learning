const { Created } = require("../core/success.reponse");
const CenterService = require("../services/center.service");

class CenterController {
  purchasePackage = async (req, res, next) => {
    const { nameCenter, address, packageId } = req.body;

    const userId = req.headers["x-client-id"];

    new Created({
      message: "Course Created!",
      metadata: await CenterService.purchasePackage({
        nameCenter,
        address,
        userId,
        packageId,
      }),
      options: {
        limit: 10,
      },
    }).send(res);
  };

  createTeacherCenter = async (req, res, next) => {
    const { lastName, email, password, centerId } = req.body;

    new Created({
      message: "Teacher Created!",
      metadata: await CenterService.createTeacherCenter({
        lastName,
        email,
        password,
        centerId,
      }),
      options: {
        limit: 10,
      },
    }).send(res);
  };
}

module.exports = new CenterController();
