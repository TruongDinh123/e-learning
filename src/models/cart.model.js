"use strict";
const { mongoose } = require("mongoose");

const DOCUMENT_NAME = "Cart";
const COLLECTION_NAME = "Carts";

const cartSchema = new mongoose.Schema(
  {
    cart_state: {
      type: String,
      required: true,
      enum: ["active", "complete", "pending"],
    },
    cart_products: {
      type: Array,
      required: true,
      default: [],
    },
    cart_count_product: { type: Number, default: 0 },
    cart_userId: { type: Number, require: true },
  },
  {
    COLLECTION_NAME,
    timestamps: true,
  }
);

module.exports = mongoose.model(DOCUMENT_NAME, cartSchema);
