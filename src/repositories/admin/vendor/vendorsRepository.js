import knex from "../../../config/knex.js";

export async function listVendors() {
  try {
    const vendors = await knex("Vendor")
      .select(
        "Id",
        "Name",
        "Email",
        "Description",
        "AddressId",
        "AdminComment",
        "Active",
        "Deleted",
        "DisplayOrder",
        "MetaKeywords",
        "MetaDescription",
        "MetaTitle",
        "PageSize",
        "AllowCustomersToSelectPageSize",
        "PageSizeOptions"
      )
      .where("Deleted", 0); // Exclude vendors with Deleted = 1
    return vendors;
  } catch (error) {
    console.error("Error in listVendors repository function:", error);
    error.statusCode = 500;
    error.message = "Error fetching vendors.";
    throw error;
  }
}

export async function createVendor(vendorData) {
  try {
    await knex("Vendor").insert(vendorData);
  } catch (error) {
    console.error("Error in createVendor repository function:", error);
    error.statusCode = 500;
    error.message = "Error creating vendor.";
    throw error;
  }
}

export async function updateVendor(id, vendorData) {
  try {
    await knex("Vendor")
      .where({ Id: id })
      .update(vendorData);
  } catch (error) {
    console.error("Error in updateVendor repository function:", error);
    error.statusCode = 500;
    error.message = "Error updating vendor.";
    throw error;
  }
}
