const cartModel = require("../models/cart.model");

class CartService {
  static async createUserCart({ userId, product }) {
    const query = { cart_userId: userId, cart_state: "active" },
      updateOrInsert = {
        $addToSet: {
          cart_products: product,
        },
      },
      option = { upsert: true, new: true };
    return await cartModel.findOneAndUpdate(query, updateOrInsert, option);
  }

  static async addToCart({ userId, product = {} }) {
    const userCart = await cartModel.findOne({ cart_userId: userId });
    if (!userCart) {
      return await CartService.createUserCart({ userId, product });
    }

    //neu co gio hang nhung chua co san pham
    if(userCart.products){
      
    }
  }
}

module.exports = CartService;
