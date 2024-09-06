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