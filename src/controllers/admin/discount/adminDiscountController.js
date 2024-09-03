import { DeleteDiscount, GetAllDiscounts, PostDiscounts } from "../../../repositories/admin/discountRepository.js";

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
    const { Name, DiscountAmount, AppliedToSubCategories } = req.body; // Extracting necessary fields from the request body

    // Constructing the discount data with default values
    const discountData = {
      Name,
      DiscountTypeId: 2, // Assuming a default value
      UsePercentage: 0,
      DiscountPercentage: 0.0000,
      DiscountAmount,
      MaximumDiscountAmount: null,
      StartDateUtc: null,
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