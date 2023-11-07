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
      const { userId, roleId } = req.body;
      const currentUserId = req.user.userId;

      const updatedUser = await AccessService.updateUserRoles({
        roleId,
        userId,
        currentUserId,
      });
      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  getAllUser = async (req, res, next) => {
    try {
      new SuccessReponse({
        message: "Get all user success",
        metadata: await AccessService.getAllUser(),
      }).send(res);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  deleteUser = async (req, res, next) => {
    const { id } = req.params;
    new SuccessReponse({
      message: "Delete user success",
      metadata: await AccessService.deleteUser({ id }),
    }).send(res);
  };
}
module.exports = new AccessController();
