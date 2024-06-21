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
  ForbiddenError,
} = require("../core/error.response");
const { findByEmail } = require("./user.service");
const Role = require("../models/role.model");

class AccessService {
  static handleRefreshToken = async ({ keyAccount, user, refreshToken }) => {
    const { userId, email } = user;

    if (keyAccount.refreshTokensUsed.includes(refreshToken)) {
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError("Refresh token has been used!! pls relogin");
    }

    if (keyAccount.refreshToken !== refreshToken) {
      throw new ForbiddenError("Refresh token has been used!! pls relogin");
    }

    const foundAccount = await findByEmail({ email });
    if (!foundAccount) throw new AuthFailureError("Refresh token not found");

    //create 1 cap moi
    const tokens = await createTokenPair(
      { userId, email },
      keyAccount.publicKey,
      keyAccount.privateKey
    );
    //update token
    await keyAccount.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken,
      },
    });

    return {
      user,
      tokens,
    };
  };

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
        fileds: ["_id", "email", "lastName", "roles"],
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
          user: newAccount,
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

  static updateUserRoles = async ({ userId, roleId }) => {
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

      if (user.roles) {
        throw new BadRequestError("User already has a role");
      }

      user.roles = role.name;
      await user.save();

      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  static getAllUser = async () => {
    try {
      const users = await User.find({ status: "active" }).lean();

      if (!users) {
        throw new NotFoundError("Users not found");
      }

      return users;
    } catch (error) {
      throw new BadRequestError("Failed to get a User", error);
    }
  };

  static deleteUser = async ({ id }) => {
    try {
      const user = await User.findOneAndUpdate(
        { _id: id },
        { status: "inactive" }
      );
      if (!user) {
        throw new NotFoundError("User not found");
      }

      user.save();
    } catch (error) {
      throw new BadRequestError(error);
    }
  };
}

module.exports = AccessService;
