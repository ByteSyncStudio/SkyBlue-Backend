import exp from "constants";
import {
  ApplyDiscountToCategory,
  ApplyDiscountToManufacturer,
  ApplyDiscountToProducts,
  DeleteDiscount,
  DeleteDiscountfromManufacturer,
  DeleteUsageDiscount,
  EditDiscountType,
  GetAllDiscounts,
  GetCategoryDiscount,
  GetDiscountWithTypes,
  GetManufacturerDiscount,
  GetProductDiscount,
  GetSubCategoryDiscounts,
  GetUsageDiscount,
  patchDiscount,
  PostDiscounts,
  RemoveDiscountFromCategory,
  RemoveDiscountFromProducts,
} from "../../../repositories/admin/discount/adminDiscountRepository.js";

// Controller to get all discounts
export const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await GetAllDiscounts();
    res.status(200).json(discounts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve discounts", error: error.message });
  }
};

// Controller to post a new discount
export const postDiscounts = async (req, res) => {
  try {
    console.log("body: ", req.body);
    const { Name, DiscountAmount, AppliedToSubCategories, DiscountTypeId } =
      req.body; // Extracting necessary fields from the request body

    //DiscountTYpeId = 1 for fixed amount discount, 2 after checkout, 5 subcategory

    // Constructing the discount data with default values
    const discountData = {
      Name,
      DiscountTypeId, // Use the DiscountTypeId from the request body
      UsePercentage: 0,
      DiscountPercentage: 0.0,
      DiscountAmount,
      MaximumDiscountAmount: null,
      StartDateUtc: new Date().toISOString(), // Automatically set StartDateUtc to current date and time in UTC
      EndDateUtc: null,
      RequiresCouponCode: 0,
      CouponCode: null,
      IsCumulative: 0,
      DiscountLimitationId: 0,
      LimitationTimes: 1,
      MaximumDiscountedQuantity: null,
      AppliedToSubCategories: AppliedToSubCategories ? 1 : 0, // Convert boolean to integer
    };

    // Call the function to insert the discount and return the full discount details
    const newDiscount = await PostDiscounts(discountData);

    res.status(201).json({
      message: "Discount created successfully",
      discount: newDiscount, // Return the full discount details
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create discount", error: error.message });
  }
};

export const deleteDiscounts = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // Parse the ID from the request parameters

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid discount ID" });
    }

    const result = await DeleteDiscount(id);

    if (result) {
      res.status(200).json({ message: "Discount deleted successfully" });
    } else {
      res.status(404).json({ message: "Discount not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete discount", error: error.message });
  }
};

export const getSubCategoryDiscounts = async (req, res) => {
  try {
    const discounts = await GetSubCategoryDiscounts();
    res.status(200).json(discounts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch discounts", error: error.message });
  }
};

// Apply discount to products
export const applyDiscountToProducts = async (req, res) => {
  try {
    const { discountId } = req.params; // Get discountId from params
    const { productIds } = req.body; // Product IDs in request body

    if (!productIds || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product IDs are required.",
      });
    }

    await ApplyDiscountToProducts(discountId, productIds);

    return res.status(200).json({
      success: true,
      message: "Discount successfully applied to selected products.",
    });
  } catch (error) {
    console.error("Error applying discount to products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to apply discount to products.",
    });
  }
};

// Apply discount to categories
export const applyDiscountToCategory = async (req, res) => {
  try {
    const { discountId } = req.params; // Get discountId from params
    const { categoryIds } = req.body; // Category IDs in request body

    if (!categoryIds || categoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category IDs are required.",
      });
    }

    await ApplyDiscountToCategory(discountId, categoryIds);

    return res.status(200).json({
      success: true,
      message: "Discount successfully applied to selected categories.",
    });
  } catch (error) {
    console.error("Error applying discount to categories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to apply discount to categories.",
    });
  }
};

export const removeDiscountFromProducts = async (req, res) => {
  try {
    const { discountId } = req.params; // Get discountId from params
    const { productIds } = req.body; // Product IDs in request body

    if (!productIds || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product IDs are required.",
      });
    }

    await RemoveDiscountFromProducts(discountId, productIds);

    return res.status(200).json({
      success: true,
      message: "Discount successfully removed from selected products.",
    });
  } catch (error) {
    console.error("Error removing discount from products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove discount from products.",
    });
  }
};

export const removeDiscountFromCategory = async (req, res) => {
  try {
    const { discountId } = req.params; // Get discountId from params
    const { categoryIds } = req.body; // Category IDs in request body

    if (!categoryIds || categoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category IDs are required.",
      });
    }

    await RemoveDiscountFromCategory(discountId, categoryIds);

    return res.status(200).json({
      success: true,
      message: "Discount successfully removed from selected categories.",
    });
  } catch (error) {
    console.error("Error removing discount from categories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove discount from categories.",
    });
  }
};

export async function getDiscountWithTypes(req, res) {
  try {
    const type = req.params.type;
    let typeId;

    switch (type) {
      case "product":
        typeId = 2;
        break;
      case "category":
        typeId = 5;
        break;
      case "order":
        typeId = 1;
        break;
      case "manufacturer":
        typeId = 3;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid discount type provided.",
        });
    }

    console.log(`Fetching discounts for type: ${type} with typeId: ${typeId}`);
    const result = await GetDiscountWithTypes(typeId);
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching discount with types:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get discount.",
    });
  }
}

export const editDiscountType = async (req, res) => {
  try {
    const { id } = req.params;

    res.status(200).send(await EditDiscountType(id));
  } catch (error) {
    console.error("Error editing discount type:", error);
    res.status(error.statusCode || 500).send({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export async function getDiscountToProducts(req, res) {
  try {
    const discountId = req.params.discountId;
    const result = await GetProductDiscount(discountId);
    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
    });
  }
}

export async function getDiscountToCategory(req, res) {
  try {
    const discountId = req.params.discountId;
    const result = await GetCategoryDiscount(discountId);
    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
    });
  }
}

export async function getUsageDiscount(req, res) {
  try {
    const discountId = req.params.discountId;
    const result = await GetUsageDiscount(discountId);
    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
    });
  }
}

export async function deleteDiscountUsage(req, res) {
  try {
    const discountId = req.params.discountId;
    const { orderId } = req.body;
    const result = await DeleteUsageDiscount(discountId, orderId);
    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error deleting :", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete.",
    });
  }
}

export async function editDiscount(req, res) {
  try {
    const { discountId } = req.params;
    const discountData = req.body;

    // Validate input
    if (!discountId || !Object.keys(discountData).length) {
      return res.status(400).json({ message: "Invalid request data." });
    }

    // Call the patchDiscount function
    const result = await patchDiscount(discountId, discountData);

    // Return response
    if (result) {
      res
        .status(200)
        .json({ message: "Discount updated successfully.", data: result });
    } else {
      res.status(404).json({ message: "Discount not found." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update discount.", error: error.message });
  }
}

export async function applyDiscountToManufacturer(req, res) {
  try {
    const discountId = req.params.discountId;
    const { manufacturerIds } = req.body;
    console.log("discountId", discountId, manufacturerIds);

    if (!discountId || !manufacturerIds) {
      return res.status(400).json({
        success: false,
        message: "Discount ID and manufacturer IDs are required.",
      });
    }

    const result = await ApplyDiscountToManufacturer(
      discountId,
      manufacturerIds
    );
    res.status(200).json({
      success: true,
      message: "Discount successfully applied to manufacturer.",
      result,
    });
  } catch (error) {
    console.log("Error applying discount to manufacturer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to apply discount to manufacturer.",
    });
  }
}

export async function getDiscountToManufacturer(req, res) {
  try {
    const discountId = req.params.discountId;
    const result = await GetManufacturerDiscount(discountId);
    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
    });
  }
}


export async function removeDiscountToManufacturer(req, res) {
  try {
    const discountId = req.params.discountId;
    const { manufacturerIds } = req.body;
    console.log("discountId", discountId, manufacturerIds);

    if (!discountId || !manufacturerIds) {
      return res.status(400).json({
        success: false,
        message: "Discount ID and manufacturer IDs are required.",
      });
    }

    const result = await DeleteDiscountfromManufacturer(
      discountId,
      manufacturerIds
    );
    res.status(200).json({
      success: true,
      message: "Discount successfully removed from manufacturer.",
      result,
    });
  } catch (error) {
    console.log("Error removing discount from manufacturer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove discount from manufacturer.",
    });
  }
}