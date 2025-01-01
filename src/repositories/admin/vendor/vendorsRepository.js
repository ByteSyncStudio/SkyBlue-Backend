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

export async function createOrUpdateAddress(addressData, vendorId) {
  // Check if the address already exists (for example, using email or a unique identifier)
  console.log("AddressData:", addressData);

  let address = await knex("Address").where("Email", addressData.Email).first();

  if (address) {
    // Update the existing address
    await knex("Address").where("Id", address.Id).update(addressData);
  } else {
    // Create a new address
    const [newAddressId] = await knex("Address")
      .insert(addressData)
      .returning("Id");

    address = { ...addressData, Id: newAddressId };

    console.log("object:", address);

    await knex("Vendor")
      .where("Id", vendorId)
      .update({ AddressId: newAddressId });

    console.log("newAddressId:", newAddressId);
  }

  return address;
}

// export async function UpdateVendorAddress(vendorId, addressData) {
//   try {

//     if (!vendorId) {
//       return res.status(400).json({ success: false, message: 'Vendor ID is required.' });
//     }

//     const newAddressData = {
//       Email: addressData.email,
//       CountryId: addressData.country,
//       StateProvinceId: addressData.state,
//       City: addressData.city,
//       Address1: addressData.address1,
//       Address2: addressData.address2,
//       ZipPostalCode: addressData.zipCode,
//       PhoneNumber: addressData.phone,
//       FaxNumber: addressData.fax,
//       CreatedOnUtc: new Date().toISOString(),
//     };

//     // Insert new address
//     const [newAddressId] = await knex('Address')
//       .insert(newAddressData)
//       .returning('Id');

//     if (!newAddressId) {
//       throw new Error('Failed to insert new address. No AddressId returned.');
//     }

//     // Update vendor with the new AddressId
//     await knex('Vendor')
//       .where('Id', vendorId)
//       .update({ AddressId: newAddressId });

//     res.status(200).json({
//       success: true,
//       message: 'Vendor address updated successfully.',
//     });
//   } catch (error) {
//     console.error('Error in updateVendorAddress API:', error);
//     res.status(500).json({ success: false, message: 'Server error.', error: error.message });
//   }
// }
