"use strict";

const express = require("express");
const { permission, asyncHandler } = require("../../auth/checkAuthen");
const productController = require("../../controllers/product.controller");
const { authentication } = require("../../auth/authUtils");
const router = express.Router();

router.use(authentication);

router.post(
  "/e-learning/products",
  permission(["Admin", "Mentor"]),
  asyncHandler(productController.createProduct)
);

router.post(
  "/e-learning/published/:product_id",
  permission(["Admin", "Mentor"]),
  asyncHandler(productController.publishProduct)
);

router.get(
  "/e-learning/drafts/all",
  permission(["Admin", "Mentor"]),
  asyncHandler(productController.getAllDraftsForShop)
);

router.get(
  "/e-learning/published/all",
  permission(["Admin", "Mentor"]),
  asyncHandler(productController.getAllPublishForShop)
);

router.get(
  "/e-learning/search/:keySearch",
  permission(["Admin", "Mentor"]),
  asyncHandler(productController.getListSearchProduct)
);

router.get(
  "/e-learning/product",
  permission(["Admin", "Mentor"]),
  asyncHandler(productController.findAllProducts)
);

router.get(
  "/e-learning/product/:product_id",
  permission(["Admin", "Mentor"]),
  asyncHandler(productController.findOneProduct)
);

router.get(
  "/e-learning/product/:product_id",
  permission(["Admin", "Mentor"]),
  asyncHandler(productController.updateProduct)
);

module.exports = router;
