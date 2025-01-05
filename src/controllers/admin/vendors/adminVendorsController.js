import {
  AddCustomerToVendor,
  createOrUpdateAddress,
  createVendor,
  getVendorAddressById,
  getVendorById,
  getVendorProductsById,
  listVendors,
  searchCustomerByEmailInDB,
  updateVendor,
} from "../../../repositories/admin/vendor/vendorsRepository.js";

// Helper function to determine page size options
const getPageSizeOptions = (pageSize) => {
  if (pageSize === 6) return "6,3,9";
  if (pageSize === 24) return "24,48,72,96";
  return "6,3,9"; // Default fallback option
};

// Get all vendors
export const getAllVendors = async (req, res) => {
  try {
    const { name } = req.query;
    const vendors = await listVendors(name);
    res.status(200).json({
      success: true,
      data: vendors,
      length: vendors.length,
      message: "Successfully fetched all vendors",
    });
  } catch (error) {
    console.error("Error in getAllVendors API:", error);
    res.status(500).send("Server error");
  }
};

// Create a new vendor
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
      return res
        .status(400)
        .json({ success: false, message: "Name and Email are required." });
    }

    // Create a vendor with the necessary fields and default values
    const vendorData = {
      Name: name.trim(),
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
      PageSizeOptions: getPageSizeOptions(pageSize),
    };
    console.log("Vendor data:", vendorData);

    await createVendor(vendorData);

    res.status(201).json({
      success: true,
      message: "Vendor created successfully.",
      data: vendorData,
    });
  } catch (error) {
    console.error("Error in createNewVendor API:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update an existing vendor
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
      deleteVendor, // Field to trigger vendor deletion
    } = req.body;

    // Ensure the vendor ID is provided
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Vendor ID is required." });
    }

    // Fetch the existing vendor data
    const existingVendor = await getVendorById(id);
    if (!existingVendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found." });
    }

    // If deleteVendor is true, mark the vendor as deleted
    if (deleteVendor) {
      await updateVendor(id, { Deleted: 1 });
      return res
        .status(200)
        .json({ success: true, message: "Vendor deleted successfully." });
    }

    // If deleteVendor is false and the vendor is currently marked as deleted, mark it as not deleted
    if (!deleteVendor && existingVendor.Deleted) {
      await updateVendor(id, { Deleted: 0 });
      return res
        .status(200)
        .json({ success: true, message: "Vendor restored successfully." });
    }

    // Prepare the updated fields
    const updatedFields = {
      Name: name ? name.trim() : existingVendor.Name,
      Email: email ? email.trim() : existingVendor.Email,
      Description: description
        ? description.trim()
        : existingVendor.Description,
      AdminComment: adminComment
        ? adminComment.trim()
        : existingVendor.AdminComment,
      Active: active ?? existingVendor.Active,
      DisplayOrder: displayOrder ?? existingVendor.DisplayOrder,
      MetaKeywords: metaKeywords
        ? metaKeywords.trim()
        : existingVendor.MetaKeywords,
      MetaDescription: metaDescription
        ? metaDescription.trim()
        : existingVendor.MetaDescription,
      MetaTitle: metaTitle ? metaTitle.trim() : existingVendor.MetaTitle,
      PageSize: pageSize ?? existingVendor.PageSize,
      PageSizeOptions:
        pageSizeOptions ??
        getPageSizeOptions(pageSize ?? existingVendor.PageSize),
      AllowCustomersToSelectPageSize: true, // Always set to true
    };

    // Update the vendor in the database
    await updateVendor(id, updatedFields);

    res.status(200).json({
      success: true,
      message: "Vendor updated successfully.",
      data: updatedFields,
    });
  } catch (error) {
    console.error("Error in patchVendor API:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getOneVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await getVendorById(id);
    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found." });
    }
    res.status(200).json({
      success: true,
      message: "Successfully fetched vendor",
      vendor,
    });
  } catch (error) {
    console.error("Error in getOneVendor API:", error);
    res.status(500).send("Server error");
  }
};

export const updateVendorAddress = async (req, res) => {
  try {
    const { vendorId } = req.params;
    console.log("Vendor ID:", vendorId);

    const {
      email,
      country,
      state,
      city,
      address1,
      address2,
      zipCode,
      phone,
      fax,
    } = req.body;

    // Validate input (optional but recommended)
    if (!vendorId) {
      return res
        .status(400)
        .json({ success: false, message: "Vendor ID is required." });
    }

    // Create or update the address in the Address table
    const addressData = {
      Email: email,
      CountryId: country, 
      StateProvinceId: state, 
      City: city,
      Address1: address1,
      Address2: address2,
      ZipPostalCode: zipCode,
      PhoneNumber: phone,
      FaxNumber: fax,
      CreatedOnUtc: new Date().toISOString(),
    };

    console.log("Address data:", addressData);

    const address = await createOrUpdateAddress(addressData, vendorId);

    res.status(200).json({
      success: true,
      message: "Vendor address updated successfully.",
      data: address,
    });
  } catch (error) {
    console.error("Error in updateVendorAddress API:", error);
    res.status(500).send("Server error");
  }
};

export const getVendorAddress = async (req, res) => {
  try {
    const { vendorId } = req.params;
    console.log("Vendor ID:", vendorId);

    // Fetch the vendor address from the Address table
    const address = await getVendorAddressById(vendorId);

    res.status(200).json({
      success: true,
      message: "Successfully fetched vendor address",
      data: address,
    });
  } catch (error) {
    console.error("Error in getVendorAddress API:", error);
    res.status(500).send("Server error");
  }
}


export const getVendorProducts = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if(!vendorId) {
      return res
        .status(400)
        .json({ success: false, message: "Vendor ID is required." });
    }

    // Fetch the vendor's products
    const products = await getVendorProductsById(vendorId);

    res.status(200).json({
      success: true,
      message: "Successfully fetched vendor products",
      data: products,
    });
  } catch (error) {
    console.error("Error in getVendorProducts API:", error);
    res.status(500).send("Server error");
  }
}


// Controller Function to Handle Search
export const searchCustomerByEmail = async (req, res) => {
  const { email } = req.query; // Get email from query parameters
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    // Fetch customer by email
    const result = await searchCustomerByEmailInDB(email);

    // If no customer found, return a message
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No customer found with the provided email",
      });
    }

    // Return customer details if found
    res.status(200).json({
      success: true,
      message: "Customer found",
      result,
    });
  } catch (error) {
    console.error("Error in searchCustomerByEmail API:", error);
    res.status(500).send("Server error");
  }
};


export const addCustomerToVendor = async (req, res) => {
  try {
    const { vendorId } = req.params; // Extract vendorId from request params
    const { customerId } = req.body; // Extract customerId from request body

    

    // Validate input
    if (!vendorId || !customerId) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID and Customer ID are required.",
      });
    }

    // Call the function to add the customer to the vendor
    const customer = await AddCustomerToVendor(vendorId, customerId);

    res.status(200).json({
      success: true,
      message: "Customer added to vendor successfully.",
      customer,
    });
  } catch (error) {
    console.error("Error in addCustomerToVendor API:", error);
    res.status(500).send("Server error");
  }
};