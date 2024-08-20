import {
  addToCart,
  getCartItems,
  removeAllCartItems,
  removeSingleCartItem,
  updateCart,
} from "../repositories/cartRepository.js";

export const addToCartController = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const customerId = 1; // Hard-coded for testing : This is userId1 email: admin@yourcompany.com from customerDB

    const storeId = 3;
    const shoppingCartTypeId = 1; // Example value, could be from req.body as well
    const createdAtUTC = new Date().toISOString();
    const updatedAtUTC = createdAtUTC;

    const cartData = {
      StoreId: storeId,
      ShoppingCartTypeId: shoppingCartTypeId,
      CustomerId: customerId,
      ProductId: productId,
      CustomerEnteredPrice: 0,
      Quantity: quantity,
      RentalStartDateUtc: null,
      RentalEndDateUtc: null,
      CreatedOnUTC: createdAtUTC,
      UpdatedOnUTC: updatedAtUTC,
    };

    const result = await addToCart(cartData);
    //console.log("result", result);
    res.status(201).json(result);

    /* 
    const cartData = req.body;
    const response = await addToCart(cartData);
    res.status(201).json(response);
    
    */
  } catch (error) {
    console.error("Error adding product to the cart:", error);
    res.status(500).json({ message: "Failed to add product to cart." });
  }
};

export const getCartItemsController = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const response = await getCartItems(customerId);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve cart items." });
  }
};

export const updateCartController = async (req, res) => {
  try {
    const { id, quantity, shoppingCartTypeId } = req.body;

    // Validate input
    if (!id || (quantity === undefined && shoppingCartTypeId === undefined)) {
      return res.status(400).json({ message: "Invalid input data." });
    }

    // Prepare the update data
    const updateData = {};
    if (quantity !== undefined) updateData.Quantity = quantity;
    if (shoppingCartTypeId !== undefined)
      updateData.ShoppingCartTypeId = shoppingCartTypeId;
    updateData.UpdatedOnUTC = new Date().toISOString();

    // Update the cart item
    const result = await updateCart(id, updateData);

    res
      .status(200)
      .json({ success: true, message: "Cart updated successfully.", result });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Failed to update cart." });
  }
};

// Controller to remove all cart items
export const removeAllCartItemsController = async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await removeAllCartItems(customerId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error("Error removing all cart items:", error);
    res.status(500).json({ message: "Failed to remove all cart items." });
  }
};

// Controller to remove a single cart item
export const removeSingleCartItemController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await removeSingleCartItem(id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({ message: "Failed to remove cart item." });
  }
};
