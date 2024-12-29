import knex from "../../../config/knex.js";

// Fetch all discounts
export async function GetAllDiscounts() {
  try {
    const discounts = await knex("dbo.Discount").select(
      "Id",
      "Name",
      "DiscountTypeId",
      "DiscountAmount",
      "LimitationTimes",
      "AppliedToSubCategories"
    );
    return discounts;
  } catch (error) {
    console.log("Something went wrong while getting discounts", error);
    throw error;
  }
}

// Insert a new discount
export async function PostDiscounts(discountData) {
  try {
    // Insert the discount into the database and return the full record
    const [newDiscount] = await knex("dbo.Discount")
      .insert(discountData)
      .returning(["Id", "Name", "DiscountAmount", "AppliedToSubCategories"]); // Return full details

    return newDiscount;
  } catch (error) {
    console.log("Something went wrong while posting discount", error);
    throw error;
  }
}

// Delete a discount by ID
export async function DeleteDiscount(id) {
  try {
    const rowsAffected = await knex("dbo.Discount").where({ Id: id }).del();

    return rowsAffected > 0; // Returns true if rows were affected (i.e., the discount was deleted)
  } catch (error) {
    console.log("Something went wrong while deleting the discount", error);
    throw error;
  }
}

export async function GetSubCategoryDiscounts() {
  try {
    const discounts = await knex("dbo.Discount")
      .where("AppliedToSubCategories", 0)
      .select(
        "Id",
        "Name",
        "DiscountTypeId",
        "DiscountAmount",
        "AppliedToSubCategories"
      );
    return discounts;
  } catch (error) {
    console.error(
      "Error fetching discounts not applied to subcategories:",
      error
    );
    throw error;
  }
}

export async function ApplyDiscountToProducts(discountId, productIds) {
  await knex("Discount_AppliedToProducts").insert(
    productIds.map((productId) => ({
      Discount_Id: discountId,
      Product_Id: productId,
    }))
  );

  console.log(`Discount ID ${discountId} applied to products: ${productIds}`);
}

export async function ApplyDiscountToCategory(discountId, categoryIds) {
  await knex("Discount_AppliedToCategories").insert(
    categoryIds.map((categoryId) => ({
      Discount_Id: discountId,
      Category_Id: categoryId,
    }))
  );

  console.log(
    `Discount ID ${discountId} applied to categories: ${categoryIds}`
  );
}

export const getAllProducts = async (req, res) => {
  try {
    const products = await knex("Product").select("Id", "Name", "Published");

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
    });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await knex("Category").select("Id", "Name");

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories.",
    });
  }
};

export async function RemoveDiscountFromProducts(discountId, productIds) {
  await knex("Discount_AppliedToProducts")
    .whereIn("Product_Id", productIds)
    .andWhere("Discount_Id", discountId)
    .del();

  console.log(`Discount ID ${discountId} removed from products: ${productIds}`);
}

export async function RemoveDiscountFromCategory(discountId, categoryIds) {
  await knex("Discount_AppliedToCategories")
    .whereIn("Category_Id", categoryIds)
    .andWhere("Discount_Id", discountId)
    .del();

  console.log(
    `Discount ID ${discountId} removed from categories: ${categoryIds}`
  );
}

export async function GetDiscountWithTypes(typeId) {
  return await knex("Discount").where("DiscountTypeId", typeId);
}

export async function EditDiscountType(id) {
  return await knex("Discount").where("Id", id);
}

export async function GetProductDiscount(discountId) {
  const result = await knex("Discount_AppliedToProducts as dap")
    .join("Product as p", "dap.Product_Id", "p.Id")
    .select("dap.Discount_Id", "dap.Product_Id", "p.Name")
    .where("dap.Discount_Id", discountId);
  return result;
}

export async function GetCategoryDiscount(discountId) {
  const result = await knex("Discount_AppliedToCategories as dac")
    .join("Category as c", "dac.Category_Id", "c.Id")
    .select("dac.Discount_Id", "dac.Category_Id", "c.Name")
    .where("dac.Discount_Id", discountId);
  return result;
}

// Function to get the discount usage history and corresponding order total
export async function GetUsageDiscount(discountId) {
  try {
    // Step 1: Fetch discount usage history along with OrderId
    const discountUsageHistory = await knex("dbo.DiscountUsageHistory as d")
      .select("d.Id", "d.DiscountId", "d.OrderId", "d.CreatedOnUtc")
      .where("d.DiscountId", discountId)
      .limit(1000); // Limit to the top 1000 records

    // Step 2: Fetch the corresponding OrderTotal from the Order table using the OrderId from the discount usage history
    const orderIds = discountUsageHistory.map((d) => d.OrderId);
    const orderTotals = await knex("dbo.Order as o")
      .select("o.Id", "o.OrderTotal")
      .whereIn("o.Id", orderIds);

    const result = discountUsageHistory.map((usage) => {
      const order = orderTotals.find((order) => order.Id === usage.OrderId);

      return {
        ...usage,
        OrderTotal: order ? order.OrderTotal : null,
      };
    });

    return result;
  } catch (error) {
    console.error("Error fetching discount usage details:", error);
    throw error; // Rethrow error for further handling
  }
}

export async function DeleteUsageDiscount(discountId, orderId) {
  try {
    const rowsAffected = await knex("dbo.DiscountUsageHistory")
      .where({ DiscountId: discountId, OrderId: orderId })
      .del();
    return rowsAffected > 0; // Returns true if rows were affected (i.e., the discount was deleted)
  } catch (error) {
    console.log("Something went wrong while deleting the discount", error);
    throw error;
  }
}
export async function patchDiscount(discountId, discountData) {
  try {
    console.log("discountData", discountData);

    // Construct the update object dynamically
    const updateData = {
      Name: discountData.name,
      DiscountTypeId: discountData.discountType,
      UsePercentage: discountData.usePercentage,
      DiscountPercentage: discountData.percentageValue || 0,
      DiscountAmount: discountData.discountAmount || 0,
      MaximumDiscountAmount: discountData.maximumDiscountAmount || null,
      StartDateUtc: discountData.startDate || null,
      EndDateUtc: discountData.endDate || null,
      RequiresCouponCode: discountData.requireCouponCode,
      CouponCode: discountData.couponCode || null,
      IsCumulative: discountData.isCumulative || false,
      DiscountLimitationId:
        discountData.discountLimitation === "Unlimited" ? 0 : 1,
      LimitationTimes: discountData.limitationValue || 1,
      MaximumDiscountedQuantity: discountData.maximumDiscountedQuantity || null,
    };

    // Add `AppliedToSubCategories` only if `discountType` is 5
    if (discountData.discountType === 5) {
      updateData.AppliedToSubCategories = discountData.applyToSubCategories;
    }

    // Perform the update using Knex
    const result = await knex("Discount")
      .where({ Id: discountId })
      .update(updateData);

    // Check if any row was affected
    if (result) {
      return await knex("Discount").where({ Id: discountId }).first();
    }

    return null;
  } catch (error) {
    console.error("Error updating discount:", error);
    throw new Error("Failed to update discount.");
  }
}

export async function ApplyDiscountToManufacturer(discountId, manufacturerIds) {
  await knex("Discount_AppliedToManufacturers").insert({
    Discount_id: discountId,
    Manufacturer_id: manufacturerIds,
  });
}

export async function GetManufacturerDiscount(discountId) {
  const result = await knex("Discount_AppliedToManufacturers as dam")
    .join("Manufacturer as m", "dam.Manufacturer_Id", "m.Id")
    .select("dam.Discount_Id", "dam.Manufacturer_Id", "m.Name")
    .where("dam.Discount_Id", discountId);
  return result;
}

export async function DeleteDiscountfromManufacturer(
  discountId,
  manufacturerIds
) {
  await knex("Discount_AppliedToManufacturers")
    .whereIn("Manufacturer_Id", manufacturerIds)
    .andWhere("Discount_Id", discountId)
    .del();

  console.log(
    `Discount ID ${discountId} removed from manufacturers: ${manufacturerIds}`
  );
}
