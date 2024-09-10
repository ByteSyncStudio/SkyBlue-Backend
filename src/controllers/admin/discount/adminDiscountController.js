import { ApplyDiscountToCategory, ApplyDiscountToProducts, DeleteDiscount, GetAllDiscounts, GetSubCategoryDiscounts, PostDiscounts, RemoveDiscountFromCategory, RemoveDiscountFromProducts } from "../../../repositories/admin/discount/adminDiscountRepository.js";

// Controller to get all discounts
export const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await GetAllDiscounts();
    res.status(200).json(discounts);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve discounts", error: error.message });
  }
};

// Controller to post a new discount
export const postDiscounts = async (req, res) => {
  try {
    const { Name, DiscountAmount, AppliedToSubCategories, DiscountTypeId } = req.body; // Extracting necessary fields from the request body

    //DiscountTYpeId = 1 for fixed amount discount, 2 after checkout, 5 subcategory

    // Constructing the discount data with default values
    const discountData = {
      Name,
      DiscountTypeId, // Use the DiscountTypeId from the request body
      UsePercentage: 0,
      DiscountPercentage: 0.0000,
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
      AppliedToSubCategories: AppliedToSubCategories ? 1 : 0 // Convert boolean to integer
    };

    // Call the function to insert the discount and return the full discount details
    const newDiscount = await PostDiscounts(discountData);

    res.status(201).json({
      message: "Discount created successfully",
      discount: newDiscount // Return the full discount details
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create discount", error: error.message });
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
    res.status(500).json({ message: "Failed to delete discount", error: error.message });
  }
}

export const getSubCategoryDiscounts = async (req, res) => {
  try {
    const discounts = await GetSubCategoryDiscounts();
    res.status(200).json(discounts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch discounts", error: error.message });
  }
};

// Apply discount to products
export const applyDiscountToProducts = async (req, res) => {
  try {
    const { discountId } = req.params; // Get discountId from params
    const { productIds } = req.body;   // Product IDs in request body

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
    const { categoryIds } = req.body;   // Category IDs in request body

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
    const { productIds } = req.body;   // Product IDs in request body

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
    const { categoryIds } = req.body;   // Category IDs in request body

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

