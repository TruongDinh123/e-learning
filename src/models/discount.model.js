"use strict";
const mongoose = require("mongoose");

const DOCUMENT_NAME = "Discount";
const COLLECTION_NAME = "discounts";

const discountSchema = new mongoose.Schema(
  {
    discount_name: { type: String, required: true },
    discount_description: { type: String },
    discount_type: { type: String, default: "fixed_amount" }, //fixed_amount: theo số tiền (percentage)
    discount_value: { type: Number, require: true },
    discount_code: { type: String, require: true },
    discount_start_date: { type: Date, require: true },
    discount_end_date: { type: Date, require: true },
    discount_max_uses: { type: Number, require: true },
    discount_users_count: { type: Number, require: true },
    discount_users_used: { type: Array, default: [] },
    discount_max_user_per_user: { type: Number, require: true }, //so luong cho phep toi da moi user su dung
    discount_min_order_value: { type: Number, require: true },
    discount_accountId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
    discount_is_active: { type: Boolean, require: true, default: true },
    discount_applies_to: {
      type: String,
      enum: ["all", "specified"],
      default: "all",
      required: true,
    },
    discount_product_Ids: { type: Array, default: [] }, //so san pham duoc ap dung
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

module.exports = mongoose.model(DOCUMENT_NAME, discountSchema);
