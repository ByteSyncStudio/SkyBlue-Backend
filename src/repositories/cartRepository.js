import knex from "../config/knex.js";
import { generateImageUrl } from "../utils/imageUtils.js";


//add to cart
async function addToCart(cartData) {
  try {
    const product = await knex("Product")
      .where({ Id: cartData.ProductId })
      .select("StockQuantity", "OrderMaximumQuantity", "OrderMinimumQuantity")
      .first();

    if (!product) {
      throw new Error("Product not found.");
    }

    if (cartData.Quantity > product.StockQuantity) {
      return {
        success: false,
        message: `Out of stock. Please enter a quantity below ${product.StockQuantity} under ${product.OrderMaximumQuantity}.`
      };
    }

    if (cartData.Quantity < product.OrderMinimumQuantity) {
      return {
        success: false,
        message: `Below minimum order limit. Please enter a quantity of at least ${product.OrderMinimumQuantity}.`
      };
    }

    if (cartData.Quantity > product.OrderMaximumQuantity) {
      return {
        success: false,
        message: `Exceeds maximum order limit. Please enter a quantity below ${product.OrderMaximumQuantity}.`
      };
    }

    const [cart] = await knex("ShoppingCartItem")
      .insert(cartData)
      .returning("*");
    return { success: true, message: "Product added to cart", cart };
  } catch (error) {
    console.error("Error adding product to cart:", error);
    throw new Error("Failed to add product to cart.");
  }
}



// Get Cart Items with Price
async function getCartItems(customerId) {
  try {
    // Join ShoppingCartItem with Product table to get the price and image
    const cartItems = await knex("ShoppingCartItem")
      .where("CustomerId", customerId)
      .join("Product", "ShoppingCartItem.ProductId", "=", "Product.Id")
      .leftJoin('Product_Picture_Mapping', 'Product.Id', 'Product_Picture_Mapping.ProductId')
      .leftJoin('Picture', 'Product_Picture_Mapping.PictureId', 'Picture.Id')
      .select(
        "ShoppingCartItem.*", 
        "Product.Price", 
        "Product_Picture_Mapping.PictureId", 
        "Picture.MimeType"
      ); // Select all fields from ShoppingCartItem, the Price from Product, and image data

    const cartItemsWithImages = cartItems.map(item => {
      let image = null;
      if (item.PictureId) {
        image = generateImageUrl(item.PictureId, item.MimeType);
      }

      return {
        ...item,
        image,
      };
    });

    //console.log("cartItemsWithImages:", cartItemsWithImages);
    return { success: true, cartItems: cartItemsWithImages };
  } catch (error) {
    console.error("Error retrieving cart items:", error);
    throw new Error("Failed to retrieve cart items.");
  }
}



// Update cart with stock validation
async function updateCart(id, updateData) {
  try {
    const cartItem = await knex("ShoppingCartItem")
      .where({ Id: id })
      .select("ProductId", "Quantity")
      .first();

    if (!cartItem) {
      throw new Error("Cart item not found.");
    }

    const product = await knex("Product")
      .where({ Id: cartItem.ProductId })
      .select("StockQuantity", "OrderMaximumQuantity", "OrderMinimumQuantity")
      .first();

    if (!product) {
      throw new Error("Product not found.");
    }

    const newQuantity = updateData.Quantity || cartItem.Quantity;

    if (newQuantity > product.StockQuantity) {
      return {
        success: false,
        message: `Out of stock. Please enter a quantity below ${product.StockQuantity} under ${product.OrderMaximumQuantity}.`
      };
    }

    if (newQuantity < product.OrderMinimumQuantity) {
      return {
        success: false,
        message: `Below minimum order limit. Please enter a quantity of at least ${product.OrderMinimumQuantity}.`
      };
    }

    if (newQuantity > product.OrderMaximumQuantity) {
      return {
        success: false,
        message: `Exceeds maximum order limit. Please enter a quantity below ${product.OrderMaximumQuantity}.`
      };
    }

    const [updatedCart] = await knex("ShoppingCartItem")
      .where({ Id: id })
      .update(updateData)
      .returning("*");
    return { success: true, message: "Cart updated successfully", updatedCart };
  } catch (error) {
    console.error("Error updating cart in database:", error);
    throw new Error("Failed to update cart.");
  }
}



// Remove all cart items for a customer
async function removeAllCartItems(customerId) {
  try {
    const deletedCount = await knex("ShoppingCartItem")
      .where({ CustomerId: customerId })
      .del();
    return { success: deletedCount > 0, message: deletedCount > 0 ? "All cart items removed successfully." : "No cart items found for this customer." };
  } catch (error) {
    console.error("Error removing all cart items:", error);
    throw new Error("Failed to remove all cart items.");
  }
}

// Remove a single cart item by ID
async function removeSingleCartItem(id) {
  try {
    const deletedCount = await knex("ShoppingCartItem")
      .where({ Id: id })
      .del();
    return { success: deletedCount > 0, message: deletedCount > 0 ? "Cart item removed successfully." : "Cart item not found." };
  } catch (error) {
    console.error("Error removing cart item:", error);
    throw new Error("Failed to remove cart item.");
  }
}

export { addToCart, getCartItems, updateCart, removeAllCartItems, removeSingleCartItem };
