import knex from "../config/knex.js";
import {
  fetchCartItems,
  getCategoryMappings,
  getDiscountCategories,
  getDiscountProducts,
  getDiscounts,
  getTierPrices,
} from "../utils/Helper.js";
//import { calculateFinalPrice, extractRoleIds, getCategoryMappings, getDiscountCategories, getDiscountProducts, getDiscounts } from "../utils/Helper.js";

import { generateImageUrl2 } from "../utils/imageUtils.js";
import { calculateTotalPriceWithTax } from "../utils/taxUtils.js";

// Add product to cart with validation
async function addToCart(cartData, user) {
  try {
    const product = await knex("Product")
      .where({ Id: cartData.ProductId })
      .select("StockQuantity", "OrderMaximumQuantity", "OrderMinimumQuantity")
      .first();

    if (!product) throw new Error("Product not found.");

    console.log("cartData", cartData);
    //validate if product already exits
    const existingCartItems = await knex("ShoppingCartItem").where({
      ProductId: cartData.ProductId,
      CustomerId: user.id,
    });
    
    // Check if the array has any items
    if (existingCartItems.length > 0) {
      return {
        success: false,
        message: "Product already exists in the cart.",
      };
    }

    // Validate quantity against product-specific limits
    if (cartData.Quantity < product.OrderMinimumQuantity) {
      return {
        success: false,
        message: `Below minimum order limit. Please enter a quantity of at least ${product.OrderMinimumQuantity}.`,
      };
    }

    if (cartData.Quantity > product.OrderMaximumQuantity) {
      return {
        success: false,
        message: `Exceeds maximum order limit. Please enter a quantity below ${product.OrderMaximumQuantity}.`,
      };
    }

    if (cartData.Quantity > product.StockQuantity) {
      return {
        success: false,
        message: `Out of stock. Please enter a quantity below ${product.StockQuantity}.`,
      };
    }

    cartData.CustomerId = user.id; // Use CustomerId from authenticated user
    const [cart] = await knex("ShoppingCartItem")
      .insert(cartData)
      .returning("*");
    return { success: true, message: "Product added to cart", cart };
  } catch (error) {
    console.error("Error adding product to cart:", error);
    throw new Error("Failed to add product to cart.");
  }
}

// Get Cart Items with Price and Tax

async function getCartItems(user) {
  try {
    const cartItems = await fetchCartItems(user.id);
    const productIds = cartItems.map((item) => item.ProductId);
    const customerRoles = user.roles.map((role) => role.Id);

    const [tierPrices, categoryMappings] = await Promise.all([
      getTierPrices(productIds, customerRoles),
      getCategoryMappings(productIds),
    ]);

    const categoryIds = categoryMappings.map((mapping) => mapping.CategoryId);
    const [discountCategories, discountProducts] = await Promise.all([
      getDiscountCategories(categoryIds),
      getDiscountProducts(productIds),
    ]);

    const discountIds = [
      ...discountCategories.map((dc) => dc.Discount_Id),
      ...discountProducts.map((dp) => dp.Discount_Id),
    ];

    const discounts = await getDiscounts(discountIds);

    const cartItemsWithPrices = cartItems.map((item) => {
      let price = item.Price;
      const tierPrice = tierPrices.find(
        (tp) => tp.ProductId === item.ProductId
      );
      if (tierPrice) price = tierPrice.Price;

      const categoryMapping = categoryMappings.find(
        (cm) => cm.ProductId === item.ProductId
      );
      let discountAmount = 0;

      if (categoryMapping) {
        const discountCategory = discountCategories.find(
          (dc) => dc.Category_Id === categoryMapping.CategoryId
        );
        if (discountCategory) {
          const discount = discounts.find(
            (d) => d.Id === discountCategory.Discount_Id
          );
          if (discount) {
            const calculatedDiscount = discount.UsePercentage
              ? (price * discount.DiscountPercentage) / 100
              : discount.DiscountAmount;
            if (calculatedDiscount < price) {
              discountAmount += calculatedDiscount;
            }
          }
        }
      }

      const discountProduct = discountProducts.find(
        (dp) => dp.Product_Id === item.ProductId
      );
      if (discountProduct) {
        const discount = discounts.find(
          (d) => d.Id === discountProduct.Discount_Id
        );
        if (discount) {
          const calculatedDiscount = discount.UsePercentage
            ? (price * discount.DiscountPercentage) / 100
            : discount.DiscountAmount;
          if (calculatedDiscount < price) {
            discountAmount += calculatedDiscount;
          }
        }
      }

      const finalPrice = Math.max(price - discountAmount, 0);
      const imageUrl = item.PictureId
        ? generateImageUrl2(item.PictureId, item.MimeType, item.SeoFileName)
        : "";

      return {
        ...item,
        Price: price,
        Discount: discountAmount,
        FinalPrice: finalPrice,
        images: imageUrl,
      };
    });

    const customerEmail = await knex("Customer")
      .where({ Id: user.id })
      .select("Email")
      .first();
    const { totalPrice, taxAmount, finalPrice } =
      await calculateTotalPriceWithTax(customerEmail, cartItemsWithPrices);

    return {
      success: true,
      cartItems: cartItemsWithPrices,
      length: cartItemsWithPrices.length,
      totalPrice,
      taxAmount,
      finalPrice,
    };
  } catch (error) {
    console.error("Error retrieving cart items:", error);
    throw new Error("Failed to retrieve cart items.");
  }
}

// Update cart with tax calculation
async function updateCart(id, updateData, user) {
  try {
    // Fetch the specific cart item to get the ProductId
    const cartItem = await knex("ShoppingCartItem")
      .where({ Id: id, CustomerId: user.id })
      .select("ProductId", "Quantity", "CustomerId")
      .first();

    if (!cartItem) {
      return { success: false, message: "Cart item not found." };
    }

    // Ensure ProductId is set in updateData
    if (!updateData.ProductId) {
      updateData.ProductId = cartItem.ProductId;
    }

    // Fetch all cart items for the given product ID for the customer
    const cartItems = await knex("ShoppingCartItem")
      .where({ CustomerId: user.id, ProductId: updateData.ProductId })
      .select("Id", "ProductId", "Quantity");

    if (cartItems.length === 0) {
      return { success: false, message: "Cart item not found." };
    }

    // Sum the total quantity of all cart items with the same product ID
    const totalQuantity = cartItems.reduce(
      (sum, item) => sum + item.Quantity,
      0
    );

    // Get the product details
    const product = await knex("Product")
      .where({ Id: updateData.ProductId })
      .select(
        "StockQuantity",
        "OrderMaximumQuantity",
        "OrderMinimumQuantity",
        "Price"
      )
      .first();

    if (!product) {
      return { success: false, message: "Product not found." };
    }

    const newQuantity = totalQuantity + updateData.Quantity;

    // Validate against stock, minimum, and maximum order quantities
    if (newQuantity > product.StockQuantity) {
      return {
        success: false,
        message: `Out of stock. Maximum available quantity is ${product.StockQuantity}.`,
      };
    }

    if (newQuantity > product.OrderMaximumQuantity) {
      return {
        success: false,
        message: `Exceeds maximum order limit. Maximum allowed quantity is ${product.OrderMaximumQuantity}.`,
      };
    }

    if (newQuantity < product.OrderMinimumQuantity) {
      return {
        success: false,
        message: `Below minimum order limit. Minimum required quantity is ${product.OrderMinimumQuantity}.`,
      };
    }

    // Update the quantity for the first cart item
    await knex("ShoppingCartItem")
      .where({ Id: cartItems[0].Id })
      .update({ Quantity: newQuantity, ...updateData });

    // Delete other cart items with the same product ID
    if (cartItems.length > 1) {
      const idsToDelete = cartItems.slice(1).map((item) => item.Id);
      await knex("ShoppingCartItem").whereIn("Id", idsToDelete).del();
    }

    const updatedCartItems = await getCartItems(user);

    return {
      success: true,
      message: "Cart updated successfully.",
      ...updatedCartItems,
    };
  } catch (error) {
    console.error("Error updating cart in database:", error);
    return { success: false, message: "Failed to update cart." };
  }
}

// Remove a single cart item and recalculate tax
async function removeSingleCartItem(id, user) {
  try {
    // Fetch the product ID for the given cart item ID
    const cartItem = await knex("ShoppingCartItem")
      .where({ Id: id, CustomerId: user.id }) // Ensure the item belongs to the authenticated user
      .select("ProductId")
      .first();

    if (!cartItem) {
      throw new Error("Cart item not found.");
    }

    const { ProductId } = cartItem;

    // Check if the customer has multiple instances of the product in their cart
    const customerCartItems = await knex("ShoppingCartItem")
      .where({ CustomerId: user.id, ProductId })
      .select("Id");

    if (customerCartItems.length === 0) {
      throw new Error("No instances of the product found in the cart.");
    }

    // Delete all instances of the product for the customer
    const deletedCount = await knex("ShoppingCartItem")
      .where({ CustomerId: user.id, ProductId })
      .del();

    const cartItems = await getCartItems(user);

    return {
      success: deletedCount > 0,
      message:
        deletedCount > 0
          ? "All instances of the product removed successfully."
          : "No instances of the product found in the cart.",
      ...cartItems,
    };
  } catch (error) {
    console.error("Error removing cart items:", error);
    throw new Error("Failed to remove cart items.");
  }
}

export async function removeAllCartItems(user) {
  try {
    const deletedCount = await knex("ShoppingCartItem")
      .where({ CustomerId: user.id })
      .del();

    return {
      success: deletedCount > 0,
      message:
        deletedCount > 0
          ? "Cart cleared successfully."
          : "No items found in the cart.",
    };
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw new Error("Failed to clear cart.");
  }
}

// Controller and repository function combined
export async function allItemRemove(userId) {
  try {
    // Validate userId
    if (!userId) {
      return { success: false, message: "User ID is required." };
    }

    // Perform the deletion
    const deletedRows = await knex("ShoppingCartItem")
      .where({ CustomerId: userId })
      .del();

    // Optionally, you can check if any rows were deleted
    if (deletedRows === 0) {
      return { success: false, message: "No cart items found for the user." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in allItemRemove:", error);
    return { success: false, message: "Failed to remove all cart items." };
  }
}

export async function GetCartCount(user) {
  try {
    const items = await knex("ShoppingCartItem")
      .select("*")
      .where({ CustomerId: user.id });

    return { count: items.length };
  } catch (error) {
    console.error("Error in cart count: ", error);
    return { success: false, message: "Failed to remove all cart items." };
  }
}

export { addToCart, getCartItems, updateCart, removeSingleCartItem };
