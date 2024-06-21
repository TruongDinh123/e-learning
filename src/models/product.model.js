"use strict";
const mongoose = require("mongoose");
const { default: slugify } = require("slugify");

const COLLECTION_NAME = "Products";
const DOCUMENT_NAME = "Product";

const productSchema = new mongoose.Schema(
  {
    product_name: { type: String, required: true },
    pruduct_thumbnail: { type: String, required: true },
    product_price: { type: Number, required: true },
    product_description: { type: String, required: true },
    product_quantity: { type: Number, required: true },
    product_slug: String,
    product_type: {
      type: String,
      required: true,
      enum: ["Electronics", "Clothing", "Food", "Books"],
    },
    product_account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product_attributes: { type: mongoose.Schema.Types.Mixed, required: true },
    product_rattingAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    product_variations: { type: Array, default: [] },
    isDraft: { type: Boolean, default: true, index: true, select: true },
    isPublished: { type: Boolean, default: false, index: true, select: false },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

productSchema.index({ product_name: "text", product_description: "text" });

//middleware
productSchema.pre("save", function (next) {
  this.product_slug = slugify(this.product_name, { lower: true });
  next();
});

const ElectronicShema = new mongoose.Schema(
  {
    manufacturer: { type: String, required: true },
    model: { type: String, required: true },
    color: { type: String, required: true },
  },
  {
    collection: "electronics",
    timestamps: true,
  }
);

const ClothingShema = new mongoose.Schema(
  {
    brand: { type: String, required: true },
    size: { type: String, required: true },
    meterial: { type: String, required: true },
  },
  {
    collection: "clothes",
    timestamps: true,
  }
);
const product = mongoose.model(DOCUMENT_NAME, productSchema);
const electronic = mongoose.model("Electronics", ElectronicShema);
const clothing = mongoose.model("Clothing", ClothingShema);

module.exports = {
  product,
  electronic,
  clothing,
};
