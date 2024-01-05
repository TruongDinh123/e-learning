"use strict";

const apiKeyModel = require("../models/apiKey.model");
const crypto = require("crypto");

const createApiKey = async (permissions) => {
  const newKey = await apiKeyModel.create({
    key: crypto.randomBytes(64).toString("hex"),
  });

  return newKey;
};

const findById = async (key) => {
  const objKey = await apiKeyModel.findOne({ key, status: true }).lean();

  return objKey;
};

module.exports = {
  findById,
  createApiKey,
};
