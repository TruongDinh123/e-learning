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
const { models } = require("mongoose");
const { BadRequestError, NotFoundError } = require("../core/error.response");
const discountModel = require("../models/discount.model");
const {
  findALlDiscountCodeUnselect,
  checkDiscountExists,
} = require("../models/repo/discount.repo");
const { findAllProducts } = require("../models/repo/product.repo");
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

  static async getAllDiscountCodesWithProduct({
    code,
    shopId,
    accountId,
    limit,
    page,
  }) {
    //create index for with product
    const foundDiscount = await discountModel
      .findOne({
        discount_code: code,
        discount_accountId: convertToObjectIdMongodb(shopId),
      })
      .lean();

    if (!foundDiscount && !foundDiscount.discount_is_active) {
      throw new BadRequestError("Discount not exists");
    }

    const { discount_applies_to, discount_product_ids } = foundDiscount;

    if (discount_applies_to === "all") {
      products = await findAllProducts({
        filter: {
          _id: convertToObjectIdMongodb(shopId),
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: "ctime",
        select: ["product_name"],
      });
    }

    if (discount_applies_to === "specific") {
      products = await findAllProducts({
        filter: {
          _id: { $in: discount_product_ids },
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: "ctime",
        select: ["product_name"],
      });
    }
  }

  static async getAllDiscountCodesByShop({ limit, page, accountId }) {
    const discounts = await findALlDiscountCodeUnselect({
      limit: +limit,
      page: +page,
      filter: {
        discount_accountId: accountId,
        discount_is_active: true,
      },
      unselect: ["__v", "discount_accountId"],
      model: "discount",
    });

    return discounts;
  }

  static async getDiscountAmount({ code, userId, shopId, products }) {
    const foundDiscount = await checkDiscountExists({
      models: discount,
      filter: {
        discount_codeId: code,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });
    if (!foundDiscount) throw new NotFoundError(`Discount not found`);

    const { discount_is_active, discount_max_uses } = foundDiscount;

    if (!discount_is_active) throw new NotFoundError(`Discount expired`);
    if (!discount_max_uses) throw new NotFoundError(`Discount are out!`);
  }
}

module.exports = DiscountService;
