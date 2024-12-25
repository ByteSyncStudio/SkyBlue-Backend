import { now } from "sequelize/lib/utils";
import knex from "../../../config/knex.js";

export async function GetAllManufacturers(name) {
  try {
    const query = knex("Manufacturer")
      .select("Manufacturer.*", "Discount.Name as DiscountName", "Discount.DiscountAmount", "Discount.Id as DiscountId")
      .leftJoin("Discount_AppliedToManufacturers", "Manufacturer.Id", "Discount_AppliedToManufacturers.Manufacturer_Id")
      .leftJoin("Discount", "Discount_AppliedToManufacturers.Discount_Id", "Discount.Id")
      .where("Manufacturer.Deleted", false);

    if (name) {
      query.andWhere("Manufacturer.Name", "like", `${name}%`);
    }

    const result = await query;
    
    return result.map((manufacturer) => ({
      id: manufacturer.Id,
      name: manufacturer.Name,
      description: manufacturer.Description,
      published: manufacturer.Published,
      metaKeywords: manufacturer.MetaKeywords,
      metaDescription: manufacturer.MetaDescription,
      metaTitle: manufacturer.MetaTitle,
      displayOrder: manufacturer.DisplayOrder,
      discountName: manufacturer.DiscountName, // Add discount name
      discountAmount: manufacturer.DiscountAmount, // Add discount amount
      discountId: manufacturer.DiscountId, // Add discount id
    }));
    
  } catch (error) {
    console.error("Error in fetching manufacturers", error);
    error.statusCode = 500;
    error.message = "Error getting manufacturers.";
    throw error;
  }
}


export async function GetManufacturersProducts(id) {
  try {
    return await knex("Manufacturer as m")
      .join("Product_Manufacturer_Mapping as pmm", "m.Id", "pmm.ManufacturerId")
      .join("Product as p", "pmm.ProductId", "p.Id")
      .select(["p.Id", "p.Name", "pmm.IsFeaturedProduct"])
      .where("m.Id", id);
  } catch (error) {
    console.error("Error in fetching manufacturers", error);
    error.statusCode = 500;
    error.message = "Error getting users.";
    throw error;
  }
}

export async function AddManufacturer(name, description) {
  const trx = await knex.transaction();

  try {
    await trx("Manufacturer").insert({
      Name: name,
      Description: description,
      ManufacturerTemplateId: 1,
      PictureId: 0,
      PageSize: 6,
      AllowCustomersToSelectPageSize: 1,
      PageSizeOptions: "6, 3, 9",
      SubjectToAcl: 0,
      LimitedToStores: 0,
      Published: 1,
      Deleted: 0,
      DisplayOrder: 0,
      CreatedOnUTC: new Date().toISOString(),
      UpdatedOnUTC: new Date().toISOString(),
    });

    await trx.commit();

    return {
      success: true,
      message: "Manufacturer added successfully",
    };
  } catch (error) {
    await trx.rollback();
    console.error("Error in adding manufacturers", error);
    error.statusCode = 500;
    error.message = "Error adding manufacturer.";
    throw error;
  }
}

export async function EditManufacturer(id, updates) {
  const trx = await knex.transaction(); // Start a transaction
  console.log("body", updates);
  console.log("id", id);

  try {
    // Extract DiscountId from updates
    const { DiscountId, ...manufacturerUpdates } = updates;

    // Prepare update data for Manufacturer table
    const updateData = {
      ...manufacturerUpdates,
      UpdatedOnUTC: new Date().toISOString(),
    };

    console.log("updateData", updateData);

    // Update Manufacturer table with the new information
    await trx("Manufacturer").where({ id }).update(updateData);

    // If DiscountId is provided, apply the discount to the manufacturer
    if (DiscountId) {
      await trx("Discount_AppliedToManufacturers").insert({
        Discount_Id: DiscountId,
        Manufacturer_Id: id, // Using the manufacturer id to apply the discount
      });
      console.log(`Discount ID ${DiscountId} applied to Manufacturer ID: ${id}`);
    } else {
      console.log("No discount applied.");
    }

    // Commit the transaction
    await trx.commit();

    return {
      success: true,
      message: `Manufacturer updated successfully` + (DiscountId ? " and discount applied" : ""),
    };
  } catch (error) {
    // Rollback the transaction if an error occurs
    await trx.rollback();
    console.error("Error in updating manufacturer and applying discount", error);
    error.statusCode = 500;
    error.message = "Error updating manufacturer and applying discount.";
    throw error;
  }
}



export async function DeleteManufacturer(id) {
  const trx = await knex.transaction();

  try {
    await trx("Manufacturer").where({ id }).update("Deleted", true);

    await trx.commit();

    return {
      success: true,
      message: "Manufacturer deleted successfully",
    };
  } catch (error) {
    await trx.rollback();
    console.error("Error in editing manufacturer", error);
    error.statusCode = 500;
    error.message = "Error editing manufacturer.";
    throw error;
  }
}

export async function AddProductManufacturer({
  productId,
  manufacturerId,
  isFeaturedProduct,
  displayOrder,
}) {
  return knex("Product_Manufacturer_Mapping").insert({
    ProductId: productId,
    ManufacturerId: manufacturerId,
    IsFeaturedProduct: isFeaturedProduct,
    DisplayOrder: displayOrder,
  });
}

export async function DeleteManufacturerProduct(productId, manufacturerId) {
  // Perform the delete operation
  const result = await knex("Product_Manufacturer_Mapping")
    .where({ ProductId: productId, ManufacturerId: manufacturerId })
    .del();

  // Check if any rows were affected
  if (result) {
    return { success: true, message: "Product deleted successfully." };
  } else {
    return { success: false, message: "Product not found." };
  }
}
