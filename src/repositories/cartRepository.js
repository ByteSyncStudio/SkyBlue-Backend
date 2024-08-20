import knex from "../config/knex.js";

// Add to Cart
async function addToCart(cartData) {
  try {
    const [cart] = await knex("ShoppingCartItem")
      .insert(cartData)
      .returning("*");
    return { success: true, message: "Product added to cart", cart };
  } catch (error) {
    console.error("Error adding product to cart:", error);
    throw new Error("Failed to add product to cart.");
  }
}

// Get Cart Items
async function getCartItems(customerId) {
  try {
    const cartItems = await knex("ShoppingCartItem")
      .where("CustomerId", customerId)
      .select("ShoppingCartItem.*", "Product.Price")
      .join("Product", "ShoppingCartItem.ProductId", "Product.Id");

    const cartItemsWithTotalPrice = cartItems.map(item => ({
      ...item,
      totalPrice: item.Quantity * item.Price,
    }));
    //console.log("cartItemsWithTotalPrice:", cartItemsWithTotalPrice)

    return { success: true, cartItems: cartItemsWithTotalPrice };
  } catch (error) {
    console.error("Error retrieving cart items:", error);
    throw new Error("Failed to retrieve cart items.");
  }
}

// Update Cart Item
async function updateCart(id, updateData) {
  try {
    // Update the cart item
    const [updatedCart] = await knex("ShoppingCartItem")
      .where({ Id: id })
      .update(updateData)
      .returning("*");

    // Get the updated price for the product
    const [cartWithPrice] = await knex("ShoppingCartItem")
      .where("ShoppingCartItem.Id", id)
      .join("Product", "ShoppingCartItem.ProductId", "Product.Id")
      .select("ShoppingCartItem.*", "Product.Price");

    // Calculate the total price
    cartWithPrice.totalPrice = cartWithPrice.Quantity * cartWithPrice.Price;

    return { success: true, message: "Cart updated successfully.", cart: cartWithPrice };
  } catch (error) {
    console.error("Error updating cart:", error);
    throw new Error("Failed to update cart.");
  }
}

// Remove All Cart Items
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

// Remove Single Cart Item
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
