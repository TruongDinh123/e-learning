const { NotFoundError, BadRequestError } = require("../core/error.response");
const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const KeyTokenService = require("./keyToken.service");
const { createTokenPair } = require("../auth/authUtils");
const { getInfoData } = require("../utils");
const centerModel = require("../models/center.model");
const { default: mongoose } = require("mongoose");

class CenterService {
  static createCenter = async (
    { nameCenter, address, userId },
    session = null
  ) => {
    const options = session ? { session } : {};
    const user = await userModel.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    user.roles = ["Center"];
    await user.save(options);

    const newCenter = await Center.create(
      [
        {
          nameCenter,
          address,
          account: userId,
        },
      ],
      options
    );

    return newCenter[0];
  };

  static purchasePackage = async ({
    nameCenter,
    address,
    userId,
    packageId,
  }) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const center = await this.createCenter(
        { nameCenter, address, userId },
        session
      );
      center.package = packageId;
      await center.save({ session });

      await session.commitTransaction();
      session.endSession();

      return center;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  };

  static createTeacherCenter = async ({
    lastName,
    email,
    password,
    centerId,
  }) => {
    try {
      const findCenter = await centerModel
        .findById(centerId)
        .populate("package");

      if (!findCenter) throw new NotFoundError("Center not found");

      if (findCenter.createdTeachers >= findCenter.package.maxTeachers) {
        throw new BadRequestError("Exceeded the maximum number of teachers");
      }
      const passwordHash = await bcrypt.hash(password, 10);

      const teacher = await userModel.create({
        lastName,
        email,
        password: passwordHash,
        roles: ["Mentor"],
        center: centerId,
      });

      findCenter.teachers.push(teacher._id);
      findCenter.createdTeachers += 1;
      await findCenter.save();

      const privateKey = crypto.randomBytes(64).toString("hex");
      const publicKey = crypto.randomBytes(64).toString("hex");

      const keyAccount = await KeyTokenService.createKeyToken({
        userId: teacher._id,
        publicKey,
        privateKey,
      });

      if (!keyAccount) {
        throw new Error("Error: keyAccount");
      }

      const tokens = await createTokenPair(
        { userId: teacher._id, email },
        publicKey,
        privateKey
      );

      return {
        code: 201,
        message: {
          account: getInfoData({
            fields: ["_id", "email", "lastName"],
            object: teacher,
          }),
          tokens,
        },
        user: teacher,
      };
    } catch (error) {
      throw error;
    }
  };
}

module.exports = CenterService;
