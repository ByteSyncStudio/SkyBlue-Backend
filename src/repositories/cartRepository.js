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
    // Subquery to get a single picture per product
    const subquery = knex("Product_Picture_Mapping")
      .select(
        "Product_Picture_Mapping.ProductId",
        knex.raw("MIN(Picture.Id) as PictureId"),
        knex.raw("MIN(Picture.MimeType) as MimeType")
      )
      .leftJoin("Picture", "Product_Picture_Mapping.PictureId", "Picture.Id")
      .groupBy("Product_Picture_Mapping.ProductId")
      .as("PictureData");

    // Fetch cart items and join with related tables
    const cartItems = await knex("ShoppingCartItem")
      .where("ShoppingCartItem.CustomerId", user.id)
      .join("Product", "ShoppingCartItem.ProductId", "Product.Id")
      .leftJoin(subquery, "ShoppingCartItem.ProductId", "PictureData.ProductId")
      .select(
        knex.raw("MIN(ShoppingCartItem.Id) as Id"), // Select one ShoppingCartItem.Id
        "ShoppingCartItem.ProductId",
        "Product.Name",
        knex.raw("SUM(ShoppingCartItem.Quantity) as Quantity"), // Aggregate quantities
        "Product.Price",
        "Product.OrderMinimumQuantity",
        "Product.OrderMaximumQuantity",
        "PictureData.PictureId", // Select the picture from the subquery
        "PictureData.MimeType" // Select the MimeType from the subquery
      )
      .groupBy(
        "ShoppingCartItem.ProductId",
        "Product.Name",
        "Product.Price",
        "Product.OrderMinimumQuantity",
        "Product.OrderMaximumQuantity",
        "PictureData.PictureId",
        "PictureData.MimeType"
      ); // Group by necessary fields to avoid duplicates

    const customerRoles = await knex("Customer_CustomerRole_Mapping")
      .where("Customer_Id", user.id)
      .pluck("CustomerRole_Id"); // Retrieve all CustomerRoleIds for the user
    //console.log("customerRoles:", customerRoles);

    const cartItemsWithPrices = await Promise.all(
      cartItems.map(async (item) => {
        let price = item.Price;
        console.log("Item Price:", item.Price);

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

        const imageUrl = item.PictureId
          ? generateImageUrl(item.PictureId, item.MimeType)
          : "";

        return { ...item, Price: price, images: imageUrl };
      })
    );

    //console.log("cartItemsWithPrices:", cartItemsWithPrices);

    //console.log("user:", user.id);

    const customerEmail = await knex("Customer")
      .where({ Id: user.id })
      .select("Email")
      .first();

    //console.log("customer Email", customerEmail);

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
      .where({ Id: id, CustomerId: user.id }) // Ensure the item belongs to the authenticated user
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
      .where({ CustomerId: user.id })
      .andWhere({ ProductId: updateData.ProductId })
      .select("Id", "ProductId", "Quantity");

    if (cartItems.length === 0) {
      return { success: false, message: "Cart item not found." };
    }

    // Sum the total quantity of all cart items with the same product ID
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.Quantity, 0);

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
      const idsToDelete = cartItems.slice(1).map(item => item.Id);
      await knex("ShoppingCartItem")
        .whereIn("Id", idsToDelete)
        .del();
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

export { addToCart, getCartItems, updateCart, removeSingleCartItem };
