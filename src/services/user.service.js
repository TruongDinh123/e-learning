"use strict";

const User = require("../models/user.model");

const findByEmail = async ({
  email,
  select = {
    email: 1,
    password: 1,
    lastName: 1,
    roles: 1,
    status: 1,
  },
}) => {
  return await User.findOne({ email }).select(select).lean();
};

const  findUserById = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
}

module.exports = {
  findByEmail,
  findUserById,
};
