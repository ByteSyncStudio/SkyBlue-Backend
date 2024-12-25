import knex from "../../../config/knex.js";


// Fetch all discounts
export async function GetAllDiscounts() {
  try {
    const discounts = await knex('dbo.Discount').select(
      'Id',
      'Name',
      'DiscountTypeId',
      'DiscountAmount',
      'LimitationTimes',
      'AppliedToSubCategories'
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
    const [newDiscount] = await knex('dbo.Discount')
      .insert(discountData)
      .returning(['Id', 'Name', 'DiscountAmount', 'AppliedToSubCategories']);  // Return full details

    return newDiscount;
  } catch (error) {
    console.log("Something went wrong while posting discount", error);
    throw error;
  }
}

// Delete a discount by ID
export async function DeleteDiscount(id) {
  try {
    const rowsAffected = await knex('dbo.Discount')
      .where({ Id: id })
      .del();

    return rowsAffected > 0; // Returns true if rows were affected (i.e., the discount was deleted)
  } catch (error) {
    console.log("Something went wrong while deleting the discount", error);
    throw error;
  }
}

export async function GetSubCategoryDiscounts() {
  try {
    const discounts = await knex('dbo.Discount')
      .where('AppliedToSubCategories', 0)
      .select(
        'Id',
        'Name',
        'DiscountTypeId',
        'DiscountAmount',
        'AppliedToSubCategories'
      );
    return discounts;
  } catch (error) {
    console.error("Error fetching discounts not applied to subcategories:", error);
    throw error;
  }
}

export async function ApplyDiscountToProducts(discountId, productIds) {
  await knex("Discount_AppliedToProducts")
    .insert(
      productIds.map((productId) => ({
        Discount_Id: discountId,
        Product_Id: productId,
      }))
    );

  console.log(`Discount ID ${discountId} applied to products: ${productIds}`);
}


export async function ApplyDiscountToCategory(discountId, categoryIds) {
  await knex("Discount_AppliedToCategories")
    .insert(
      categoryIds.map((categoryId) => ({
        Discount_Id: discountId,
        Category_Id: categoryId,
      }))
    );

  console.log(`Discount ID ${discountId} applied to categories: ${categoryIds}`);
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

  console.log(`Discount ID ${discountId} removed from categories: ${categoryIds}`);
}


export async function GetDiscountWithTypes(typeId) {
  return await knex('Discount')
  .where('DiscountTypeId', typeId)
}