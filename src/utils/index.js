"use strict";

const _ = require("lodash");
const { Types } = require("mongoose");
const crypto = require('crypto');

const secret = 'upSsln2tTkQT3uMCYdxt7oraspZqRXMq';
const secretKey = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);

function encrypt(text) {
  const iv = crypto.randomBytes(16); // Vector khởi tạo
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
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
