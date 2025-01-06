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
      query.andWhere("Name", "like", `${name}%`);
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
    await knex("Vendor").where({ Id: id }).update(vendorData);
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
        .whereIn("Id", vendor.PictureId.split(",")); // Assuming PictureIds are stored as a comma-separated string
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

    // Step 4: Fetch associated customers
    const customers = await knex("Customer")
      .select(
        "Id",
        "CustomerGuid",
        "Username",
        "Email",
        "AdminComment",
        "Active",
        "CreatedOnUtc",
        "LastActivityDateUtc"
      )
      .where({ VendorId: id });

    // Step 5: Combine the vendor data with the picture and customer data
    return {
      ...vendor,
      pictures: picturesWithUrls, // Array of picture objects with image URLs
      customers, // Array of customer objects associated with the vendor
    };
  } catch (error) {
    console.error("Error in getVendorWithImagesById function:", error);
    throw new Error("Error fetching vendor with images and customers.");
  }
}


export async function createOrUpdateAddress(addressData, vendorId) {
  console.log("AddressData:", addressData);

  let address = await knex("Address").where("Email", addressData.Email).first();

  if (address) {
    // Update the existing address
    await knex("Address").where("Id", address.Id).update(addressData);
  } else {
    // Create a new address
    const [newAddress] = await knex("Address")
      .insert(addressData)
      .returning("Id");

    const newAddressId = newAddress.Id || newAddress; // Extract Id in case of different dialects

    console.log("newAddressId:", newAddressId);

    address = { ...addressData, Id: newAddressId };

    console.log("Created address:", address);

    // Update the Vendor table with the new AddressId
    await knex("Vendor")
      .where("Id", vendorId)
      .update({ AddressId: newAddressId });

    console.log(
      `Vendor (ID: ${vendorId}) updated with AddressId: ${newAddressId}`
    );
  }

  return address;
}

export async function getVendorAddressById(vendorId) {
  try {
    // Step 1: Fetch AddressId from Vendor Table
    const vendor = await knex("Vendor")
      .select("AddressId")
      .where({ Id: vendorId })
      .first();

    if (!vendor || !vendor.AddressId) {
      throw new Error(`No address found for Vendor ID: ${vendorId}`);
    }

    console.log(`Vendor ID: ${vendorId}, Address ID: ${vendor.AddressId}`);

    // Step 2: Fetch Address Details from Address Table
    const address = await knex("Address")
      .select(
        "Id",
        "Email",
        "CountryId",
        "StateProvinceId",
        "City",
        "Address1",
        "Address2",
        "ZipPostalCode",
        "PhoneNumber",
        "FaxNumber"
      )
      .where({ Id: vendor.AddressId })
      .first();

    if (!address) {
      throw new Error(`Address not found for Address ID: ${vendor.AddressId}`);
    }

    console.log(`Address details fetched for Vendor ID: ${vendorId}`);

    return address;
  } catch (error) {
    console.error("Error in getVendorAddress repository function:", error);
    throw new Error("Error fetching vendor address.");
  }
}

export async function getVendorProductsById(vendorId) {
  try {
    const products = await knex("Product")
      .select("Id", "Name", "Published")
      .where({ VendorId: vendorId });

    return products;
  } catch (error) {
    console.error("Error in getVendorProductsById repository function:", error);
    throw new Error("Error fetching vendor products.");
  }
}

// Function to search customer by email in the database
export async function searchCustomerByEmailInDB(email) {
  try {
    const customers = await knex("Customer")
      .select(
        "Id",
        "CustomerGuid",
        "Username",
        "Email",
        "VendorId",
        "Active",
        "IsApproved",
        "CreatedOnUtc"
      )
      .where("Email", "like", `%${email}%`); // Using 'like' for partial match

    return customers;
  } catch (error) {
    console.error(
      "Error in searchCustomerByEmailInDB repository function:",
      error
    );
    throw new Error("Error searching for customer by email.");
  }
}

// Repository function to add customer to vendor
export async function AddCustomerToVendor(vendorId, customerId) {
  try {
    const customer = await knex("Customer")
      .select("Id", "VendorId", "Email")
      .where("Id", customerId)
      .first();

    if (customer.VendorId) {
      return { message: "Customer already has a vendor.", email: customer.Email };
    }

    await knex("Customer")
      .where("Id", customer.Id)
      .update({ VendorId: vendorId });

    // Return the updated customer
    return { ...customer, VendorId: vendorId };
  } catch (error) {
    console.error("Error in AddCustomerToVendor repository function:", error);
    throw new Error("Error adding customer to vendor.");
  }
}

export async function getVendorEditById(id) { 
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
        .whereIn("Id", vendor.PictureId.split(",")); // Assuming PictureIds are stored as a comma-separated string
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

    // Step 4: Fetch associated customers
    const customers = await knex("Customer")
      .select(
        "Id",
        "Username",
        "Email",
        "Active"
      )
      .where({ VendorId: id });

    // Step 5: Combine the vendor data with the picture and customer data
    return {
      ...vendor,
      pictures: picturesWithUrls, // Array of picture objects with image URLs
      customers, // Array of customer objects associated with the vendor
    };
  } catch (error) {
    console.error("Error in getVendorWithImagesById function:", error);
    throw new Error("Error fetching vendor with images and customers.");
  }
}

export async function RemoveCustomerFromVendor(customerId){
  try {
    const customer = await knex("Customer")
      .select("Id", "VendorId", "Email")
      .where("Id", customerId)
      .first();

    if (!customer.VendorId) {
      return { message: "Customer does not have a vendor.", email: customer.Email };
    }

    await knex("Customer")
      .where("Id", customer.Id)
      .update({ VendorId: 0 });

    // Return the updated customer
    return { ...customer, VendorId: 0 };
  } catch (error) {
    console.error("Error in RemoveCustomerFromVendor repository function:", error);
    throw new Error("Error removing customer from vendor.");
  }
}