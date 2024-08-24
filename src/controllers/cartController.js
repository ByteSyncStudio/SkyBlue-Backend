import {
  addToCart,
  getCartItems,
  removeSingleCartItem,
  updateCart,
} from "../repositories/cartRepository.js";

// Add to Cart Controller
export const addToCartController = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const storeId = 3;
    const shoppingCartTypeId = 1;
    const createdAtUTC = new Date().toISOString();
    const updatedAtUTC = createdAtUTC;

    const cartData = {
      StoreId: storeId,
      ShoppingCartTypeId: shoppingCartTypeId,
      ProductId: productId,
      CustomerEnteredPrice: 0,
      Quantity: quantity,
      RentalStartDateUtc: null,
      RentalEndDateUtc: null,
      CreatedOnUTC: createdAtUTC,
      UpdatedOnUTC: updatedAtUTC,
    };

    const result = await addToCart(cartData, req.user); // Pass req.user to the repo
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error("Error adding product to the cart:", error);
    res.status(500).json({ message: "Failed to add product to cart." });
  }
};

// Get Cart Items Controller
export const getCartItemsController = async (req, res) => {
  try {
    const response = await getCartItems(req.user); 
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve cart items." });
  }
};

// Update Cart Controller
export const updateCartController = async (req, res) => {
  try {
    const { id, quantity, shoppingCartTypeId } = req.body;
    if (!id || (quantity === undefined && shoppingCartTypeId === undefined)) {
      return res.status(400).json({ message: "Invalid input data." });
    }

    const updateData = {};
    if (quantity !== undefined) updateData.Quantity = quantity;
    if (shoppingCartTypeId !== undefined) updateData.ShoppingCartTypeId = shoppingCartTypeId;
    updateData.UpdatedOnUTC = new Date().toISOString();

    const result = await updateCart(id, updateData, req.user); // Pass req.user to the repo

    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Failed to update cart." });
  }
};


// Remove Single Cart Item Controller
export const removeSingleCartItemController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Cart item ID is required." });

    const result = await removeSingleCartItem(id, req.user); // Use req.user for user information
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({ message: "Failed to remove cart item." });
  }
};
