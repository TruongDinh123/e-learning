"use strict";

const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const KeyTokenService = require("./keyToken.service");
const { createTokenPair } = require("../auth/authUtils");
const { getInfoData } = require("../utils");
const {
  BadRequestError,
  AuthFailureError,
  NotFoundError,
} = require("../core/error.response");
const { findByEmail } = require("./user.service");
const Role = require("../models/role.model");

class AccessService {
  static login = async ({ email, password, refreshToken = null } = null) => {
    const foundAccount = await findByEmail({ email });
    if (!foundAccount) {
      throw new BadRequestError("Error: account not found");
    }

    const match = await bcrypt.compare(password, foundAccount.password);
    if (!match) {
      throw new AuthFailureError("Error: password is incorrect");
    }

    const privateKey = crypto.randomBytes(64).toString("hex");
    const publicKey = crypto.randomBytes(64).toString("hex");

    const { _id: userId } = foundAccount;

    const tokens = await createTokenPair(
      { userId, email },
      publicKey,
      privateKey
    );

    await KeyTokenService.createKeyToken({
      refreshToken: tokens.refreshToken,
      privateKey,
      publicKey,
      userId,
    });

    return {
      account: getInfoData({
        fileds: ["_id", "email", "lastName"],
        object: foundAccount,
      }),
      tokens,
    };
  };

  static signUp = async ({ lastName, email, password }) => {
    try {
      const holderAccount = await User.findOne({ email }).lean();
      if (holderAccount) {
        throw new BadRequestError("Error: account already exists");
      }
      const passwordHash = await bcrypt.hash(password, 10);

      const newAccount = await User.create({
        email,
        lastName,
        password: passwordHash,
      });

      if (newAccount) {
        const privateKey = crypto.randomBytes(64).toString("hex");
        const publicKey = crypto.randomBytes(64).toString("hex");

        console.log({ privateKey, publicKey });

        const keyAccount = await KeyTokenService.createKeyToken({
          userId: newAccount._id,
          publicKey,
          privateKey,
        });

        if (!keyAccount) {
          return {
            code: "xxx",
            message: "Error: keyAccount",
          };
        }

        const tokens = await createTokenPair(
          { userId: newAccount._id, email },
          publicKey,
          privateKey
        );

        return {
          code: 201,
          message: {
            account: getInfoData({
              fileds: ["_id", "email", "lastName"],
              object: newAccount,
            }),
            tokens,
          },
        };
      }

      return {
        code: 200,
        metadata: null,
      };
    } catch (error) {
      return {
        code: "xxx",
        message: error.message,
        status: "error",
      };
    }
  };

  static logout = async (keyAccount) => {
    const delKey = await KeyTokenService.removeKeyById(keyAccount._id);
    console.log({ delKey });
    return delKey;
  };

  static updateUserRoles = async ({userId, roleId}) => {
    try {
      // Use RoleService to get the role
      const role = await Role.findById(roleId);

      if (!role) {
        throw new NotFoundError("Role not found");
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Update the user's role
      user.roles = role.name;
      await user.save();

      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
}

module.exports = AccessService;
