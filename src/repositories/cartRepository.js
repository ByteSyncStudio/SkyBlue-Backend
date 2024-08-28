import knex from "../config/knex.js";
import { generateImageUrl } from "../utils/imageUtils.js";
import { calculateTotalPriceWithTax } from "../utils/taxUtils.js";

// Add product to cart with validation
async function addToCart(cartData, user) {
  try {
    const product = await knex("Product")
      .where({ Id: cartData.ProductId })
      .select("StockQuantity", "OrderMaximumQuantity", "OrderMinimumQuantity")
      .first();

    if (!product) throw new Error("Product not found.");

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
    //cartData.CustomerId = 46097;
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
    // Fetch cart items and join with related tables
    const cartItems = await knex("ShoppingCartItem")
      .where("ShoppingCartItem.CustomerId", user.id)
      .join("Product", "ShoppingCartItem.ProductId", "Product.Id")
      .leftJoin(
        "Product_Picture_Mapping",
        "Product.Id",
        "Product_Picture_Mapping.ProductId"
      )
      .leftJoin("Picture", "Product_Picture_Mapping.PictureId", "Picture.Id")
      .select(
        "ShoppingCartItem.ProductId",
        "Product.Name",
        "Product.Price",
        "Product.OrderMinimumQuantity",
        "Product.OrderMaximumQuantity",
        knex.raw("SUM(ShoppingCartItem.Quantity) as Quantity"),  // Aggregate quantities
        knex.raw("MIN(Picture.Id) as PictureId"),  // Select the lowest Picture.Id
        knex.raw("MIN(Picture.MimeType) as MimeType")  // Select the MimeType corresponding to the lowest Picture.Id
      )
      .groupBy(
        "ShoppingCartItem.ProductId",
        "Product.Name",
        "Product.Price",
        "Product.OrderMinimumQuantity",
        "Product.OrderMaximumQuantity"
      ); // Group by ProductId and other non-aggregated columns

    const customerRoles = await knex("Customer_CustomerRole_Mapping")
      .where("Customer_Id", user.id)
      .pluck("CustomerRole_Id"); // Retrieve all CustomerRoleIds for the user

    const cartItemsWithPrices = await Promise.all(
      cartItems.map(async (item) => {
        let price = item.Price;

        if (customerRoles.length > 0) {
          // Fetch tiered price if roles exist
          const tierPrice = await knex("TierPrice")
            .whereIn("CustomerRoleId", customerRoles)
            .andWhere("ProductId", Number(item.ProductId)) // Ensure ProductId is a number
            .orderBy("Price", "asc")
            .first();

          if (tierPrice) {
            price = tierPrice.Price; // Use the tiered price if found
          }
        }

        const imageUrl = item.PictureId ? generateImageUrl(item.PictureId, item.MimeType) : "";

        return { ...item, Price: price, images: imageUrl };
      })
    );

    const { totalPrice, taxAmount, finalPrice } =
      await calculateTotalPriceWithTax(user.email, cartItemsWithPrices);

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
    const cartItem = await knex("ShoppingCartItem")
      .where({ Id: id, CustomerId: user.id }) // Ensure the item belongs to the authenticated user
      .select("ProductId", "Quantity", "CustomerId")
      .first();

    if (!cartItem) {
      return { success: false, message: "Cart item not found." };
    }

    const product = await knex("Product")
      .where({ Id: cartItem.ProductId })
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

    const customerRoles = await knex("Customer_CustomerRole_Mapping")
      .where("Customer_Id", user.id)
      .pluck("CustomerRole_Id");

    let price = product.Price;

    if (customerRoles.length > 0) {
      const tierPrice = await knex("TierPrice")
        .whereIn("CustomerRoleId", customerRoles)
        .andWhere("ProductId", cartItem.ProductId)
        .orderBy("Price", "asc")
        .first();

      if (tierPrice) {
        price = tierPrice.Price;
      }
    }

    const newQuantity = updateData.Quantity || cartItem.Quantity;

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

    // Update cart item with valid quantity
    const [updatedCart] = await knex("ShoppingCartItem")
      .where({ Id: id })
      .update(updateData)
      .returning("*");

    const cartItems = await getCartItems(user);

    return {
      success: true,
      message: "Cart updated successfully.",
      updatedCart,
      ...cartItems,
    };
  } catch (error) {
    console.error("Error updating cart in database:", error);
    return { success: false, message: "Failed to update cart." };
  }
}

// Remove a single cart item and recalculate tax
async function removeSingleCartItem(id, user) {
  try {
    const cartItem = await knex("ShoppingCartItem")
      .where({ Id: id, CustomerId: user.id }) // Ensure the item belongs to the authenticated user
      .select("CustomerId")
      .first();

    if (!cartItem) {
      throw new Error("Cart item not found.");
    }

    const deletedCount = await knex("ShoppingCartItem").where({ Id: id }).del();

    const cartItems = await getCartItems(user);

    return {
      success: deletedCount > 0,
      message:
        deletedCount > 0
          ? "Cart item removed successfully."
          : "Cart item not found.",
      ...cartItems,
    };
  } catch (error) {
    console.error("Error removing cart item:", error);
    throw new Error("Failed to remove cart item.");
  }
}

export { addToCart, getCartItems, updateCart, removeSingleCartItem };
