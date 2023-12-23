const { SuccessReponse } = require("../core/success.reponse");
const ProductService = require("../services/product.service");

class ProductController {
  createProduct = async (req, res, next) => {
    new SuccessReponse({
      message: "Create product successfully",
      metadata: await ProductService.createProduct(req.body.product_type, {
        ...req.body,
        product_account: req.user.userId,
      }),
    }).send(res);
  };

  updateProduct = async (req, res, next) => {
    new SuccessReponse({
      message: "Update product successfully",
      metadata: await ProductService.updateProduct(
        req.body.product_type,
        req.params.product_id,
        {
          ...req.body,
          product_account: req.user.userId,
        }
      ),
    }).send(res);
  };

  publishProduct = async (req, res, next) => {
    new SuccessReponse({
      message: "Publish product successfully",
      metadata: await ProductService.publishProductByShop({
        product_account: req.user.userId,
        product_id: req.params.product_id,
      }),
    }).send(res);
  };

  getAllDraftsForShop = async (req, res, next) => {
    new SuccessReponse({
      message: "Get all draft for shop successfully",
      metadata: await ProductService.findAllDraftsForShop({
        product_account: req.user.userId,
      }),
    }).send(res);
  };

  getAllPublishForShop = async (req, res, next) => {
    new SuccessReponse({
      message: "Get all published for shop successfully",
      metadata: await ProductService.findAllPublishForShop({
        product_account: req.user.userId,
      }),
    }).send(res);
  };

  getListSearchProduct = async (req, res, next) => {
    new SuccessReponse({
      message: "Get all published for shop successfully",
      metadata: await ProductService.searchProducts(req.params),
    }).send(res);
  };

  findAllProducts = async (req, res, next) => {
    new SuccessReponse({
      message: "Get list find all products successfully",
      metadata: await ProductService.findAllProducts(req.query),
    }).send(res);
  };

  findOneProduct = async (req, res, next) => {
    new SuccessReponse({
      message: "Get find one product successfully",
      metadata: await ProductService.findOneProduct({
        product_id: req.params.product_id,
      }),
    }).send(res);
  };
}

module.exports = new ProductController();
