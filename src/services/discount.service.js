/*
Discout Service
    1- Generator Discount code [Shop | Admin]
    2- Get discount code [User]
    3- Get all discount codes [User | Shop]
    4- Verify discount code [User]
    5- Delete discount code [Admin | Shop]
    6- Cancel discount code [User]
*/

"use strict";
const { BadRequestError, NotFoundError } = require("../core/error.response");
const discountModel = require("../models/discount.model");
const { convertToObjectIdMongodb } = require("../utils");

class DiscountService {
  static async createDiscountService(payload) {
    const {
      code,
      start_date,
      end_date,
      is_active,
      accountId,
      min_order_value,
      product_ids,
      applies_to,
      name,
      description,
      type,
      value,
      max_value,
      max_uses,
      uses_count,
      max_uses_per_user,
    } = payload;
    //kiem tra
    if (new Date() < new Date(start_date) && new Date() > new Date(end_date)) {
      throw new BadRequestError("Discount code has expired");
    }

    if (new Date(start_date) >= new Date(end_date)) {
      throw new BadRequestError("Start date must be before end date");
    }

    const foundDiscount = await discountModel
      .findOne({
        discount_code: code,
        discount_accountId: convertToObjectIdMongodb(accountId),
      })
      .lean();

    if (foundDiscount && foundDiscount.discount_is_active) {
      throw new BadRequestError("Discount code already exists");
    }

    const newDiscount = await discountModel.create({
      discount_name: name,
      discount_description: description,
      discount_type: type,
      discount_value: value,
      discount_max_value: max_value,
      discount_code: code,
      discount_start_date: new Date(start_date),
      discount_end_date: new Date(end_date),
      discount_max_uses: max_uses,
      discount_users_count: uses_count,
      discount_max_user_per_user: max_uses_per_user,
      discount_min_order_value: min_order_value || 0,
      discount_accountId: accountId,
      discount_is_active: is_active,
      discount_applies_to: applies_to,
      discount_product_Ids: applies_to === "all" ? [] : product_ids,
    });

    return newDiscount;
  }
}

module.exports = DiscountService;
