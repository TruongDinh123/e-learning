"use strict";

const { findById } = require("../services/apiKey.service");
const { findUserById } = require("../services/user.service");

const HEADER = {
  API_KEY: "x-api-key",
  AUTHORIZATION: "authorization",
};

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
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const permission = (roles) => {
  return async (req, res, next) => {
    try {
      const userId = req.keyAccount.user;
      const user = await findUserById(userId);
      const userRoles = user.roles;

      const hasRoleMatchingPermission = userRoles.some((role) =>
        roles.includes(role)
      );

      if (!hasRoleMatchingPermission) {
        return res.status(403).json({
          message: "Permission denied",
        });
      }

      return next();
    } catch (error) {
      console.log(error);
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
