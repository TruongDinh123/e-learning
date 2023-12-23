const inventoryModel = require("../inventory.model");
const { Types } = require("mongoose");

const insertInventory = async ({
  productId,
  accountId,
  stuck,
  location = "unknow",
}) => {
  return await inventoryModel.create({
    inven_productId: productId,
    inven_location: location,
    inven_stock: stuck,
    iven_accountId: accountId,
  });
};

module.exports = { insertInventory };
