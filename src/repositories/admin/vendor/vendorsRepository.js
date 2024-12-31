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
    // Step 1: Fetch vendor details
    const vendor = await knex("Vendor")
      .select(
        "Id",
        "Name",
        "Email",
        "Description",
        "PictureId",
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

    if (!vendor) {
      throw new Error("Vendor not found.");
    }

    // Step 2: Fetch all pictures related to the vendor
    let picturesData = [];
    if (vendor.PictureId) {
      picturesData = await knex("Picture")
        .select(
          "Id",
          "PictureBinary",
          "MimeType",
          "SeoFilename",
          "AltAttribute",
          "TitleAttribute",
          "IsNew"
        )
        .whereIn("Id", vendor.PictureId.split(',')); // Assuming PictureIds are stored as a comma-separated string
    }

    // Step 3: Generate image URLs for each picture
    const picturesWithUrls = picturesData.map((picture) => ({
      ...picture,
      imageUrl: generateImageUrl2(
        picture.Id,
        picture.MimeType,
        picture.SeoFilename
      ),
    }));

    // Step 4: Combine the vendor data with the picture data
    return {
      ...vendor,
      pictures: picturesWithUrls, // Array of picture objects with image URLs
    };
  } catch (error) {
    console.error("Error in getVendorWithImagesById function:", error);
    throw new Error("Error fetching vendor with images.");
  }
}