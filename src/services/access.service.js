'use strict';

const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const KeyTokenService = require('./keyToken.service');
const {createTokenPair} = require('../auth/authUtils');
const {getInfoData} = require('../utils');
const {
  BadRequestError,
  AuthFailureError,
  NotFoundError,
  ForbiddenError,
} = require('../core/error.response');
const {
  findByEmail,
  generatePassword,
  findByLoginName,
} = require('./user.service');
const Role = require('../models/role.model');
const validateMongoDbId = require('../config/validateMongoDbId');
const {v2: cloudinary} = require('cloudinary');
const nodemailer = require('nodemailer');
const Score = require('../models/score.model');

const {Types} = require('mongoose');

cloudinary.config({
  cloud_name: 'dvsvd87sm',
  api_key: '243392977754277',
  api_secret: 'YnSIAsvn7hRPqxTdIQBX9gBzihE',
});

class AccessService {
  static handleRefreshToken = async ({keyAccount, user, refreshToken}) => {
    const {userId, loginName} = user;

    if (keyAccount.refreshTokensUsed.includes(refreshToken)) {
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError('Refresh token has been used!! pls relogin');
    }

    if (keyAccount.refreshToken !== refreshToken) {
      throw new ForbiddenError('Refresh token has been used!! pls relogin');
    }

    const foundAccount = await findByLoginName({loginName});
    if (!foundAccount) throw new AuthFailureError('Refresh token not found');

    //create 1 cap moi
    const tokens = await createTokenPair(
      {userId, loginName},
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

  static login = async ({loginName, password, refreshToken = null} = null) => {
    const foundAccount = await findByLoginName({loginName});
    if (!foundAccount) {
      throw new BadRequestError('Email or Password is not correct');
    }

    if (foundAccount.status === 'inactive') {
      throw new AuthFailureError('Account not found');
    }

    const match = await bcrypt.compare(password, foundAccount.password);
    if (!match) {
      throw new BadRequestError('Email or Password is not correct');
    }

    const privateKey = crypto.randomBytes(64).toString('hex');
    const publicKey = crypto.randomBytes(64).toString('hex');

    const {_id: userId} = foundAccount;

    const tokens = await createTokenPair(
      {userId, loginName},
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
        fileds: [
          '_id',
          'firstName',
          'loginName',
          'email',
          'lastName',
          'roles',
          'image_url',
          'quizCount',
          'quizLimit',
          'courses',
        ],
        object: foundAccount,
      }),
      tokens,
    };
  };

  static changePassword = async ({currentUserId, oldPassword, newPassword}) => {
    const user = await User.findById(currentUserId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      throw new BadRequestError('Mật khẩu không đúng');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.password = passwordHash;
    const updatedUser = await user.save();
    return updatedUser;
  };

  static signUp = async ({
    loginName,
    email,
    password,
    cmnd,
    phone,
    address,
    cap,
    firstName,
    lastName,
  }) => {
    try {
      const holderAccount = await User.findOne({loginName}).lean();
      if (holderAccount) {
        throw new BadRequestError(
          'Error: loginName đã tồn tại trong hệ thống, vui lòng thử một loginName khác'
        );
      }
      console.log(loginName, 'loginNameloginName');
      const passwordHash = await bcrypt.hash(password, 10);
      const traineeRole = await Role.findOne({name: 'Trainee'});
      console.log(loginName, 'loginNameloginName');

      const newAccount = await User.create({
        loginName,
        email,
        password: passwordHash,
        roles: [traineeRole._id],
        cmnd: cmnd ?? '',
        phoneNumber: phone ?? '',
        address: address ?? '',
        cap: cap ?? '',
        firstName: firstName ?? '',
        lastName: lastName ?? '',
      });

      if (newAccount) {
        const privateKey = crypto.randomBytes(64).toString('hex');
        const publicKey = crypto.randomBytes(64).toString('hex');

        const keyAccount = await KeyTokenService.createKeyToken({
          userId: newAccount._id,
          publicKey,
          privateKey,
        });

        if (!keyAccount) {
          return {
            code: '403',
            message: 'Error: Không thể tạo key cho account, vui lòng thử lại ',
          };
        }

        const tokens = await createTokenPair(
          {userId: newAccount._id, loginName},
          publicKey,
          privateKey
        );

        return {
          code: 201,
          message: {
            account: getInfoData({
              fileds: ['_id', 'loginName', 'email', 'lastName'],
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
        code: 'xxx',
        message: error.message,
        status: 'error',
      };
    }
  };

  static forgotPasword = async ({email}) => {
    const foundEmail = findByEmail({email});
    if (!foundEmail) {
      throw new NotFoundError('Email không đúng hoặc không tồn tại');
    } else {
      const newPassword = generatePassword();
      const passwordHash = await bcrypt.hash(newPassword, 10);
      const user = await User.findOneAndUpdate(
        {email},
        {password: passwordHash}
      );
      if (!user) {
        throw new NotFoundError('Email không đúng hoặc không tồn tại');
      } else {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: '247learn.vn@gmail.com',
            pass: 'glpiggogzyxtfhod',
          },
        });

        const mailOptions = {
          from: '247learn.vn@gmail.com',
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
            throw new BadRequestError('Failed to send email', error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
      }
    }
  };

  static logout = async (keyAccount) => {
    const delKey = await KeyTokenService.removeKeyById(keyAccount._id);
    console.log({delKey});
    return delKey;
  };

  static updateUserRoles = async ({userId, roleId}) => {
    try {
      // Use RoleService to get the role
      const role = await Role.findById(roleId);

      if (!role) {
        throw new NotFoundError('Role not found');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if the role is already assigned to the user
      // Check if the role is already assigned to the user
      if (
        user.roles.map((role) => role.toString()).includes(role._id.toString())
      ) {
        throw new BadRequestError('User already has this role');
      }

      user.roles = [role._id];
      await user.save();

      return user;
    } catch (error) {
      console.log('🚀 ~ error:', error);
      throw new BadRequestError('Failed to update user role');
    }
  };

  static getAllUser = async (page = 1, limit = 5, search = '', role = '') => {
    try {
      // Tạo điều kiện tìm kiếm dựa trên tên và vai trò
      let query = {status: 'active'};

      const users = await User.find(query)
        .select('loginName lastName firstName email status')
        .populate('roles', '_id name')
        .lean()
        .sort({updatedAt: -1, createdAt: -1});

      if (!users) {
        throw new NotFoundError('Users not found');
      }

      return {
        users,
      };
    } catch (error) {
      throw new BadRequestError('Failed to get a User', error);
    }
  };

  static getAUser = async (id) => {
    validateMongoDbId(id);
    try {
      const user = await User.findOne({status: 'active', _id: id})
        .select('-createdAt -updatedAt -__v -password -courses')
        .populate('roles', '_id name')
        .populate('quizzes')
        .populate('courses', '_id name teacherQuizzes')
        .lean();

      return user;
    } catch (error) {
      throw new BadRequestError('Failed to get a user', error);
    }
  };

  static deleteUser = async ({id}) => {
    try {
      const user = await User.findById(id);
      user.loginName = 'hahah';
      console.log(user, 'userssss');
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await user.deactivate();
    } catch (error) {
      throw new BadRequestError(error);
    }
  };

  static updateUser = async (infoUpdate) => {
    const user = await User.findById(infoUpdate.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    Object.assign(user, infoUpdate);

    const updateUser = await user.save();
    return updateUser;
  };

  static uploadImageUser = async ({filename, userId}) => {
    validateMongoDbId(userId);
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.filename && user.image_url) {
        await cloudinary.uploader.destroy(user.filename, {
          resource_type: 'image',
        });
      }
      const result = await cloudinary.uploader.upload(filename, {
        folder: 'user',
        resource_type: 'image',
      });
      user.filename = result.public_id;
      user.image_url = result.secure_url;
      await user.save();
      return user;
    } catch (error) {
      throw new BadRequestError(error);
    }
  };

  static getAllUserFinishTheContest = async (quizId) => {
    const quizIdObj = new Types.ObjectId(quizId);

    try {
      const users = await Score.aggregate([
        {$match: {quiz: quizIdObj}}, // Lọc những score có quiz ID tương ứng
        {
          $lookup: {
            // Thực hiện join với bảng User
            from: 'users', // Tên bảng người dùng trong MongoDB
            localField: 'user',
            foreignField: '_id',
            as: 'userData',
          },
        },
        {$unwind: '$userData'}, // Duỗi mảng userData để truy cập dễ dàng
        {
          $project: {
            _id: 1,
            cap: '$userData.cap',
            donvi: '$userData.donvi',
            donvicon: '$userData.donvicon',
          },
        },
      ]);

      return users;
    } catch (e) {
      console.error('Error in querying users:', e);
      return {};
    }
  };
}

module.exports = AccessService;
