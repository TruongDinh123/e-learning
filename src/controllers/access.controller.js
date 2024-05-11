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

  handlerRefreshToken = async (req, res, next) => {
    new SuccessReponse({
      message: "Get token success",
      metadata: await AccessService.handleRefreshToken({
        refreshToken: req.refreshToken,
        user: req.user,
        keyAccount: req.keyAccount,
      }),
    }).send(res);
  };

  changePassword = async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    const currentUserId = req.user.userId;

    new SuccessReponse({
      message: "Đổi mật khẩu thành công",
      metadata: await AccessService.changePassword({
        oldPassword,
        newPassword,
        currentUserId,
      }),
    }).send(res);
  };

  forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    new SuccessReponse({
      message: "Forgot password success",
      metadata: await AccessService.forgotPasword({ email }),
    }).send(res);
  };

  updateUserRoles = async (req, res, next) => {
    const { userId, roleId } = req.body;
    const currentUserId = req.user.userId;

    new SuccessReponse({
      message: "Get all user success",
      metadata: await AccessService.updateUserRoles({
        roleId,
        userId,
        currentUserId,
      }),
    }).send(res);
  };

  getAllUser = async (req, res, next) => {
    // const { page, limit, search, role } = req.query;
    try {
      new SuccessReponse({
        message: "Get all user success",
        metadata: await AccessService.getAllUser(),
      }).send(res);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  getAUser = async (req, res, next) => {
    const { id } = req.params;
    new SuccessReponse({
      message: "Get a user success",
      metadata: await AccessService.getAUser(id),
    }).send(res);
  };

  deleteUser = async (req, res, next) => {
    const { id } = req.params;
    new SuccessReponse({
      message: "Delete user success",
      metadata: await AccessService.deleteUser({ id }),
    }).send(res);
  };

  updateUser = async (req, res, next) => {
    const { id } = req.params;
    const { lastName, email, firstName, dob, phoneNumber, gender } = req.body;

    new SuccessReponse({
      message: "Update user success",
      metadata: await AccessService.updateUser({
        id,
        lastName,
        email,
        firstName,
        dob,
        phoneNumber,
        gender,
      }),
    }).send(res);
  };

  uploadImageUser = async (req, res, next) => {
    const { userId } = req.params;
    const { path: filename } = req.file;

    new SuccessReponse({
      message: "Upload image successfully",
      metadata: await AccessService.uploadImageUser({ userId, filename }),
    }).send(res);
  };

  getAllUserFinishTheContest = async (req, res, next) => {
    const {quizId} = req.params;
    const metadata = await AccessService.getAllUserFinishTheContest(quizId);

    new SuccessReponse({
      message: "Get all user finished course success",
      metadata: metadata,
    }).send(res);
  }
}
module.exports = new AccessController();
