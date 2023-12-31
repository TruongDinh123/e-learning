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
const validateMongoDbId = require("../config/validateMongoDbId");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: "dvsvd87sm",
  api_key: "243392977754277",
  api_secret: "YnSIAsvn7hRPqxTdIQBX9gBzihE",
});

class AccessService {
  static login = async ({ email, password, refreshToken = null } = null) => {
    const foundAccount = await findByEmail({ email });
    if (!foundAccount) {
      throw new BadRequestError("Email or Password is not correct");
    }

    if (foundAccount.status === "inactive") {
      throw new AuthFailureError("Account not found");
    }

    const match = await bcrypt.compare(password, foundAccount.password);
    if (!match) {
      throw new AuthFailureError("Email or Password is not correct");
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

  static changePassword = async ({
    currentUserId,
    oldPassword,
    newPassword,
  }) => {
    const user = await User.findById(currentUserId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      throw new AuthFailureError("Mật khẩu không đúng");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.password = passwordHash;
    const updatedUser = await user.save();
    return updatedUser;
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
        roles: "Trainee",
      });

      if (newAccount) {
        const privateKey = crypto.randomBytes(64).toString("hex");
        const publicKey = crypto.randomBytes(64).toString("hex");

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

  static getAUser = async (id) => {
    validateMongoDbId(id);
    try {
      const user = await User.findOne({ status: "active", _id: id }).lean();

      return user;
    } catch (error) {
      throw new BadRequestError("Failed to get a user", error);
    }
  };

  static deleteUser = async ({ id }) => {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      await user.deactivate();
    } catch (error) {
      throw new BadRequestError(error);
    }
  };

  static updateUser = async ({ id, lastName, email, firstName }) => {
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    user.lastName = lastName;
    user.email = email;
    user.firstName = firstName;
    const updateUser = await user.save();
    return updateUser;
  };

  static uploadImageUser = async ({ filename, userId }) => {
    validateMongoDbId(userId);
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (user.filename && user.image_url) {
        await cloudinary.uploader.destroy(user.filename, {
          resource_type: "image",
        });
      }
      const result = await cloudinary.uploader.upload(filename, {
        folder: "user",
        resource_type: "image",
      });
      user.filename = result.public_id;
      user.image_url = result.secure_url;
      await user.save();
      return user;
    } catch (error) {
      throw new BadRequestError(error);
    }
  };
}

module.exports = AccessService;
