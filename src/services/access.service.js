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
const nodemailer = require("nodemailer");

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
        fileds: ["_id", "firstName", "email", "lastName", "roles", "image_url", 'quizCount', 'quizLimit', 'courses'],
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

  static forgotPasword = async ({ email }) => {
    const foundEmail = findByEmail({ email });
    if (!foundEmail) {
      throw new NotFoundError("Email không đúng hoặc không tồn tại");
    } else {
      const newPassword = crypto.randomBytes(4).toString("hex");
      const passwordHash = await bcrypt.hash(newPassword, 10);
      const user = await User.findOneAndUpdate(
        { email },
        { password: passwordHash }
      );
      if (!user) {
        throw new NotFoundError("Email không đúng hoặc không tồn tại");
      } else {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "247learn.vn@gmail.com",
            pass: "glpiggogzyxtfhod",
          },
        });

        const mailOptions = {
          from: "247learn.vn@gmail.com",
          to: email,
          subject: `Chào mừng bạn đến với 247learn.vn`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Đổi mật khẩu</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { width: 600px; margin: auto; }
                    .header { background-color: #002C6A; color: white; padding: 10px; text-align: center; }
                    .content { padding: 20px; }
                    .footer { background-color: #f2f2f2; padding: 10px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Chào mừng đến với <a href="https://www.247learn.vn" style="color: white; text-decoration: none;">247learn.vn</a></h1>
                    </div>
                    <div class="content">
                        <p>Xin chào,</p>
                        <p>Mật khẩu mới của bạn là: <strong>${newPassword}</strong></p>
                        <p>Vui lòng không chia sẻ thông tin tài khoản của bạn với người khác. Bạn có thể đổi mật khẩu sau khi đăng nhập.</p>
                        <p>Trân trọng,</p>
                        <p>Nếu có bất kỳ thắc mắc nào, xin đừng ngần ngại liên hệ với chúng tôi qua <a href="mailto: 247learn.vn@gmail.com">247learn.vn@gmail.com</a>.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 <a href="https://www.247learn.vn" style="color: inherit; text-decoration: none;">247learn.vn</a>. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
          `,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            throw new BadRequestError("Failed to send email", error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      }
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

      // Check if the role is already assigned to the user
      // Check if the role is already assigned to the user
      if (
        user.roles.map((role) => role.toString()).includes(role._id.toString())
      ) {
        throw new BadRequestError("User already has this role");
      }

      user.roles = [role._id];
      await user.save();

      return user;
    } catch (error) {
      console.log("🚀 ~ error:", error);
      throw new BadRequestError("Failed to update user role");
    }
  };

  static getAllUser = async (page = 1, limit = 5, search = "", role = "") => {
    try {
      // Tạo điều kiện tìm kiếm dựa trên tên và vai trò
      let query = { status: "active" };
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ];
      }
      if (role) {
        query.roles = role;
      }

      const users = await User.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("roles", "_id name")
        .lean();

      const total = await User.countDocuments(query);
      const pages = Math.ceil(total / limit);

      if (!users) {
        throw new NotFoundError("Users not found");
      }

      return {
        users,
        total,
        pages,
        currentPage: page,
        pageSize: users.length,
      };
    } catch (error) {
      throw new BadRequestError("Failed to get a User", error);
    }
  };

  static getAUser = async (id) => {
    validateMongoDbId(id);
    try {
      const user = await User.findOne({ status: "active", _id: id })
        .select("-createdAt -updatedAt -__v -password -courses")
        .populate("roles", "_id name")
        .populate("quizzes")
        .lean();

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

  static updateUser = async ({
    id,
    lastName,
    email,
    firstName,
    dob,
    phoneNumber,
    gender,
  }) => {
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    user.lastName = lastName;
    user.firstName = firstName;
    user.email = email;
    user.dob = dob;
    user.phoneNumber = phoneNumber;
    user.gender = gender;
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
