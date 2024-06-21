"use strict";
const JWT = require("jsonwebtoken");
const asyncHandler = require("../helpers/asyncHandler");
const { AuthFailureError, NotFoundError } = require("../core/error.response");
const { findByUserId } = require("../services/keyToken.service");

const HEADER = {
  API_KEY: "x-api-key",
  CLIENT_ID: "x-client-id",
  AUTHORIZATION: "authorization",
  REFRESHTOKEN: "refresh-token",
};

// khi login => cos header => BE nhan 3 thang do'
// tạo 1 page manager roles =>
// ktra xem có quyền ko => xử lí api

const createTokenPair = async (payload, publicKey, privateKey) => {
  try {
    const accessToken = await JWT.sign(payload, publicKey, {
      expiresIn: "2 days",
    });

    const refreshToken = await JWT.sign(payload, privateKey, {
      expiresIn: "7 days",
    });

    JWT.verify(accessToken, publicKey, (err, decode) => {
      if (err) {
        console.log(`error verify::`, err);
      } else {
        console.log(`decode::`, decode);
      }
    });

    return { accessToken, refreshToken };
  } catch (error) {}
};

const authentication = asyncHandler(async (req, res, next) => {
  const userId = req.headers[HEADER.CLIENT_ID];
  if (!userId) throw new AuthFailureError(`Invalid client id`);

  const keyAccount = await findByUserId(userId);
  if (!keyAccount) throw new NotFoundError("Not found key account");

  if (req.headers[HEADER.REFRESHTOKEN]) {
    try {
      const refreshToken = req.headers[HEADER.REFRESHTOKEN];
      const decodeUser = await JWT.verify(refreshToken, keyAccount.privateKey);
      if (userId !== decodeUser.userId)
        throw new AuthFailureError("Invalid access token user id");
      req.keyAccount = keyAccount;
      req.user = decodeUser;
      req.refreshToken = refreshToken;
      return next();
    } catch (error) {
      throw error;
    }
  }

  const accessToken = req.headers[HEADER.AUTHORIZATION];
  if (!accessToken) throw new AuthFailureError("Invalid access token");

  try {
    const decodeUser = await JWT.verify(accessToken, keyAccount.publicKey);
    if (userId !== decodeUser.userId)
      throw new AuthFailureError("Invalid access token user id");
    req.keyAccount = keyAccount;
    req.user = decodeUser;
    return next();
  } catch (error) {
    throw error;
  }
});

const verifyJwt = async (token, keySecret) => {
  return await JWT.verify(token, keySecret);
};

module.exports = {
  createTokenPair,
  authentication,
  verifyJwt,
};
