import { createVendor, listVendors, updateVendor } from "../../../repositories/admin/vendor/vendorsRepository.js";

export const getAllVendors = async (req, res) => {
  try {
    const vendors = await listVendors();
    res.status(200).json({
      success: true,
      data: vendors,
      length: vendors.length,
      message: "Successfully fetched all vendors",
    });
  } catch (error) {
    console.error("Error in getAllVendors API:", error);
    res.status(error.statusCode || 500).send(error.message || "Server error");
  }
};

export const createNewVendor = async (req, res) => {
  try {
    const {
      name,
      email,
      description,
      adminComment,
      active,
      displayOrder,
      metaKeywords,
      metaDescription,
      metaTitle,
      pageSize = 6, // Default to 6 if not provided
    } = req.body;

    // Ensure required fields are provided and valid
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and Email are required." });
    }

    // Set pageSizeOptions based on the provided or default pageSize
    let finalPageSizeOptions;
    if (pageSize === 6) {
      finalPageSizeOptions = "6,3,9";
    } else if (pageSize === 24) {
      finalPageSizeOptions = "24,48,72,96";
    } else {
      finalPageSizeOptions = "6,3,9"; // Default to "6,3,9" for any other value
    }

    // Create a vendor with the necessary fields and default values
    const vendorData = {
      Name: name,
      Email: email.trim(),
      Description: description ? description.trim() : null,
      PictureId: 0,
      AddressId: 0,
      AdminComment: adminComment ? adminComment.trim() : null,
      Active: active ?? true,
      Deleted: false,
      DisplayOrder: displayOrder ?? 0,
      MetaKeywords: metaKeywords ? metaKeywords.trim() : null,
      MetaDescription: metaDescription ? metaDescription.trim() : null,
      MetaTitle: metaTitle ? metaTitle.trim() : null,
      PageSize: pageSize,
      AllowCustomersToSelectPageSize: true, // Always set to true
      PageSizeOptions: finalPageSizeOptions,
    };

    await createVendor(vendorData);

    res.status(201).json({ success: true, message: "Vendor created successfully.", data: vendorData });
  } catch (error) {
    console.error("Error in createNewVendor API:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Server error" });
  }
};


export const patchVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      description,
      adminComment,
      active,
      displayOrder,
      metaKeywords,
      metaDescription,
      metaTitle,
      pageSize,
      pageSizeOptions,
      deleteVendor, // New field to trigger vendor deletion
    } = req.body;

    // Ensure the vendor ID is provided
    if (!id) {
      return res.status(400).json({ success: false, message: "Vendor ID is required." });
    }

    // If deleteVendor is true, mark the vendor as deleted
    if (deleteVendor) {
      await updateVendor(id, { Deleted: 1 });
      return res.status(200).json({ success: true, message: "Vendor deleted successfully." });
    }

    // Set default values and conditions for pageSize and pageSizeOptions
    let finalPageSize = pageSize ?? 6;
    let finalPageSizeOptions;

    if (finalPageSize === 6) {
      finalPageSizeOptions = "6,3,9";
    } else if (finalPageSize === 24) {
      finalPageSizeOptions = "24,48,72,96";
    } else {
      finalPageSizeOptions = "6,3,9"; // Default fallback option
    }

    // AllowCustomersToSelectPageSize should always be true
    const finalAllowCustomersToSelectPageSize = true;

    // Create a vendor object with the fields to update, setting missing values to null
    const vendorData = {
      Name: name ? name.trim() : null,
      Email: email ? email.trim() : null,
      Description: description ? description.trim() : null,
      AdminComment: adminComment ? adminComment.trim() : null,
      Active: active ?? null,
      DisplayOrder: 0,
      MetaKeywords: metaKeywords ? metaKeywords.trim() : null,
      MetaDescription: metaDescription ? metaDescription.trim() : null,
      MetaTitle: metaTitle ? metaTitle.trim() : null,
      PageSize: finalPageSize,
      AllowCustomersToSelectPageSize: finalAllowCustomersToSelectPageSize,
      PageSizeOptions: finalPageSizeOptions,
    };

    // Update the vendor in the database
    await updateVendor(id, vendorData);

    res.status(200).json({ success: true, message: "Vendor updated successfully.", data: vendorData });
  } catch (error) {
    console.error("Error in patchVendor API:", error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Server error" });
  }
};