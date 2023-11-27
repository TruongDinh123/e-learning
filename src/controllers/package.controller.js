const { SuccessReponse } = require("../core/success.reponse");
const PackageService = require("../services/package.service");

class PackageController {
  createPackage = async (req, res, next) => {
    const { name, maxTeachers, price } = req.body;
    new SuccessReponse({
      metadata: await PackageService.createPackage({
        name,
        maxTeachers,
        price,
      }),
    }).send(res);
  };
}

module.exports = new PackageController();
