"use strict";

const _ = require("lodash");
const { Types } = require("mongoose");

const convertToObjectIdMongodb = (id) => Types.ObjectId(id);

const getInfoData = ({ fileds = [], object = {} }) => {
  return _.pick(object, fileds);
};

const getSelectData = (select = []) => {
  //['a', 'b] = { a: 1, b: 1}
  return Object.fromEntries(select.map((el) => [el, 1]));
};

const unGetSelectData = (select = []) => {
  //['a', 'b] = { a: 0, b: 0}
  return Object.fromEntries(select.map((el) => [el, 0]));
};

const removeundefinedObject = (obj) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] == null) {
      delete obj[key];
    }
  });
  return obj;
};


/*
const a = {
  c: {
    d: 1,
    ....
  }
}

=> db.conllection.updateOne(
  `c.d`:1
)
*/
const updateNestedObjectParser = (obj) => {
  const final = {};
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      const nested = updateNestedObjectParser(obj[key]);
      Object.keys(nested).forEach((nestedKey) => {
        final[`${key}.${nestedKey}`] = nested[nestedKey];
      });
    } else {
      final[key] = obj[key];
    }
  });
  return final;
};

module.exports = {
  getInfoData,
  getSelectData,
  unGetSelectData,
  removeundefinedObject,
  updateNestedObjectParser,
  convertToObjectIdMongodb,
};
