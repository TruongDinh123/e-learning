"use strict";

const { getSelectData } = require("../../utils");

const findALlDiscountCodeUnselect = async ({
  limit = 50,
  sort,
  page = 1,
  filter,
  unselect,
  model,
}) => {
  const skip = (page - 1) * limit;
  const sortBy = sort === "ctime" ? { _id: -1 } : { _id: 1 };
  const documents = await model
    .find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(getSelectData(unselect))
    .lean();

  return documents;
};

const findALlDiscountCodeSelect = async ({
  limit = 50,
  sort,
  page = 1,
  filter,
  select,
  model,
}) => {
  const skip = (page - 1) * limit;
  const sortBy = sort === "ctime" ? { _id: -1 } : { _id: 1 };
  const documents = await model
    .find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(getSelectData(select))
    .lean();

  return documents;
};

const checkDiscountExists = async (model, filter) => {
  return await model.findOne(filter).lean();
};

module.exports = {
  findALlDiscountCodeUnselect,
  findALlDiscountCodeSelect,
  checkDiscountExists,
};
