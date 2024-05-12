"use strict";

const _ = require("lodash");
const { Types } = require("mongoose");
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = '12345678901234567890123456789012'; // Khóa 32 bytes cho aes-256
const iv = '1234567890123456'; // IV 16 bytes

function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), Buffer.from(iv));
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

const convertToObjectIdMongodb = (id) => new Types.ObjectId(id);

const getInfoData = ({ fileds = [], object = {} }) => {
  return _.pick(object, fileds);
};

module.exports = {
  getInfoData,
  convertToObjectIdMongodb,
  encrypt
};
