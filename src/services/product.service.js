"use strict";

const { BadRequestError } = require("../core/error.response");
const { clothing, electronic, product } = require("../models/product.model");
const { insertInventory } = require("../models/repo/inventory.repo");
const {
  findAllDraftForShop,
  publishProductByShop,
  findAllPublishForShop,
  searchProductsForShop,
  findAllProducts,
  findOneProudct,
  updateProductById,
} = require("../models/repo/product.repo");
const { removeundefinedObject, updateNestedObjectParser } = require("../utils");

class ProductFactory {
  static productRegistry = {};
  static registerProductType(type, classRef) {
    ProductFactory.productRegistry[type] = classRef;
  }
  static async createProduct(type, payload) {
    const productClass = ProductFactory.productRegistry[type];
    if (!productClass) {
      throw new BadRequestError("Product type is not supported");
    }
    return new productClass(payload).createProduct();
  }

  static updateProduct(type, payload, productId) {
    const productClass = ProductFactory.productRegistry[type];
    if (!productClass) {
      throw new BadRequestError("Product type is not supported");
    }
    return new productClass(payload).updateProduct(productId);
  }

  static async findAllDraftsForShop({ product_account, limit = 50, skip = 0 }) {
    const query = { product_account, isDraft: true };
    return await findAllDraftForShop({ query, limit, skip });
  }

  static async publishProductByShop({ product_account, product_id }) {
    return await publishProductByShop({ product_account, product_id });
  }

  static async findAllPublishForShop({
    product_account,
    limit = 50,
    skip = 0,
  }) {
    const query = { product_account, isPublished: true };
    return await findAllPublishForShop({ query, limit, skip });
  }

  static async searchProducts({ keySearch }) {
    return await searchProductsForShop({ keySearch });
  }

  static async findAllProducts({
    limit = 50,
    sort = "ctime",
    page = 1,
    filter = { isPublished: true },
  }) {
    return await findAllProducts({
      limit,
      sort,
      page,
      filter,
      select: [
        "product_name",
        "product_price",
        "product_description",
        "pruduct_thumbnail",
      ],
    });
  }

  static async findProduct({ keySearch }) {
    return await searchProudctByUser({ keySearch });
  }

  static async findOneProduct({ product_id }) {
    return await findOneProudct({ product_id, unSelect: ["__v"] });
  }
}

class Product {
  constructor({
    product_name,
    pruduct_thumbnail,
    product_price,
    product_description,
    product_quantity,
    product_type,
    product_account,
    product_attributes,
  }) {
    this.product_name = product_name;
    this.pruduct_thumbnail = pruduct_thumbnail;
    this.product_price = product_price;
    this.product_description = product_description;
    this.product_quantity = product_quantity;
    this.product_type = product_type;
    this.product_account = product_account;
    this.product_attributes = product_attributes;
  }

  async createProduct(product_id) {
    const newProduct = await product.create({ ...this, _id: product_id });
    if (newProduct) {
      await insertInventory({
        productId: newProduct._id,
        accountId: this.product_account,
        stuck: this.product_quantity,
      });
    }
    return newProduct;
  }

  async updateProduct(product_id, bodyUpdate) {
    return await updateProductById({ product_id, bodyUpdate, model: product });
  }
}

class Clothing extends Product {
  async createProduct() {
    const newClothing = await clothing.create(this.product_attributes);
    if (!newClothing) {
      throw new BadRequestError("Create clothing failed");
    }
    const newProduct = await super.createProduct();
    if (!newProduct) {
      throw new BadRequestError("Create product failed");
    }
    return newProduct;
  }

  async updateProduct(productId) {
    /*
     {
      a: underfined,
      b: null
     } 
    */
    //1. remove attr has null underfined
    const objectParams = removeundefinedObject(this);
    //2. check xem update o cho nao?
    if (objectParams.product_attributes) {
      //3. update child
      await updateProductById({
        productId,
        bodyUpdate: updateNestedObjectParser(objectParams.product_attributes),
        model: clothing,
      });
    }
    const updateProject = await super.updateProduct(productId, objectParams);
    return updateProject;
  }
}

class Electronics extends Product {
  async createProduct() {
    const newElectronic = await electronic.create({
      ...this.product_attributes,
      product_account: this.product_account,
    });
    if (!newElectronic) {
      throw new BadRequestError("Create electronic failed");
    }
    const newProduct = await super.createProduct(newElectronic._id);
    if (!newProduct) {
      throw new BadRequestError("Create product failed");
    }
    return newProduct;
  }
}

ProductFactory.registerProductType("Clothing", Clothing);
ProductFactory.registerProductType("Electronics", Electronics);

module.exports = ProductFactory;
