"use strict";

const { findById } = require("../services/apiKey.service");
const { findUserById } = require("../services/user.service");

const HEADER = {
  API_KEY: "x-api-key",
  AUTHORIZATION: "authorization",
  CLIENT_ID: "x-client-id",
};

// cách hđ của apikey là để bảo mật thông tin trình duyệt.
const apiKey = async (req, res, next) => {
  try {
    const key = await req.headers[HEADER.API_KEY]?.toString();
    if (!key) {
      return res.status(403).json({
        message: "Forbidden apiKey Error",
      });
    }
    //check objKey
    const objKey = await findById(key);
    if (!objKey) {
      return res.status(403).json({
        message: "Forbidden objKey Error",
      });
    }
    req.objKey = objKey;
    return next();
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
//check roles
const permission = (roles) => {
  return async (req, res, next) => {
    try {
      const userId = req.headers[HEADER.CLIENT_ID];
      if (!userId) throw new AuthFailureError(`Invalid client id`);

      const user = await findUserById(userId);

      const userRoles = user.roles.map((role) => role.name);

      const hasRoleMatchingPermission = userRoles.some((roleName) =>
        roles.includes(roleName)
      );

      if (!hasRoleMatchingPermission) {
        return res.status(403).json({
          message: "Permission denied",
        });
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  };
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = { apiKey, permission, asyncHandler };
