"use strict";
const mongoose = require("mongoose");

const DOCUMENT_NAME = "Inventory";
const COLLECTION_NAME = "Inventories";

const productSchema = new mongoose.Schema(
  {
    inven_productId: { type: mongoose.Types.ObjectId, ref: "Product" },
    inven_location: { type: String, default: "unKnow" },
    inven_stock: { type: Number, require: true, ref: "User" },
    iven_accountId: { type: mongoose.Types.ObjectId, ref: "ProUserduct" },
    iven_reservations: { type: Array, default: [] },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

module.exports = mongoose.model(DOCUMENT_NAME, productSchema);
