import knex from "../../../config/knex.js";

// List all vendors excluding deleted ones
export async function listVendors(name) {
  try {
    const query = knex("Vendor")
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
      .where("Deleted", 0);

    if (name) {
      query.andWhere('Name', 'like', `${name}%`)
    }

    return await query;

  } catch (error) {
    console.error("Error in listVendors repository function:", error);
    throw new Error("Error fetching vendors.");
  }
}

// Create a new vendor
export async function createVendor(vendorData) {
  try {
    await knex("Vendor").insert(vendorData);
  } catch (error) {
    console.error("Error in createVendor repository function:", error);
    throw new Error("Error creating vendor.");
  }
}

// Update an existing vendor
export async function updateVendor(id, vendorData) {
  try {
    await knex("Vendor")
      .where({ Id: id })
      .update(vendorData);
  } catch (error) {
    console.error("Error in updateVendor repository function:", error);
    throw new Error("Error updating vendor.");
  }
}

// Get a vendor by ID
export async function getVendorById(id) {
  try {
    return await knex("Vendor")
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
      .where({ Id: id })
      .first();
  } catch (error) {
    console.error("Error in getVendorById repository function:", error);
    throw new Error("Error fetching vendor.");
  }
}