"use strict";
const AccessService = require("../services/access.service");
const { SuccessReponse } = require("../core/success.reponse");

class AccessController {
  login = async (req, res, next) => {
    new SuccessReponse({
      metadata: await AccessService.login(req.body),
    }).send(res);
  };

  signUp = async (req, res, next) => {
    return res.status(201).json(await AccessService.signUp(req.body));
  };

  logOut = async (req, res, next) => {
    new SuccessReponse({
      message: "Logout success",
      metadata: await AccessService.logout(req.keyAccount),
    }).send(res);
  };

  updateUserRoles = async (req, res, next) => {
    try {
      const { userId, roleId } = req.params;
      const updatedUser = await AccessService.updateUserRoles({
        userId,
        roleId,
      });
      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
module.exports = new AccessController();
