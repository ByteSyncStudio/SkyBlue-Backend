import knex from "../../../config/knex.js";
import {
  AddProductToFlyer,
  DeleteProductFlyer,
  EditProductFlyer,
  GetAllFlyers,
  GetFlyerPreview,
} from "../../../repositories/admin/flyer/adminFlyerRepository.js";

export async function getFlyerProducts(req, res) {
  try {
    console.log("req");
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

export async function getAllFlyerController(req, res) {
  try {
    const flyers = await GetAllFlyers(); // Fetch flyers from the repository
    res.status(200).json({
      success: true,
      flyers,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

export async function addProductToFlyerController(req, res) {
  try {
    // Extract product details from the request body
    const productDetails = req.body;

    console.log("productDetails", productDetails);

    // Call repository function to add product to flyer
    const result = await AddProductToFlyer(productDetails);

    // Return success response
    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

export async function editProductFlyerController(req, res) {
  const { flyerid } = req.params; // This should match the route parameter
  const { DisplayOrder } = req.body;

  try {
    const flyer = await knex("Flyer")
      .where({ Id: flyerid }) // Ensure you are using FlyerId
      .first();

    if (!flyer) {
      throw {
        statusCode: 404,
        message: "Flyer not found",
      };
    }

    // Update the DisplayOrder
    await knex("Flyer").where({ Id: flyerid }).update({ DisplayOrder });

    res.status(200).json({
      success: true,
      message: "Flyer DisplayOrder updated successfully",
    });
  } catch (error) {
    console.error("Error editing product in flyer:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

export async function deleteProductFlyerController(req, res) {
  const { flyerid } = req.params;

  try {
    await DeleteProductFlyer(flyerid);
    res.status(200).json({
      success: true,
      message: "Flyer deleted successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}


// Updated Controller to handle one role at a time
export async function getFlyerPreviewController(req, res) {
  try {
    // Get customerRole from query parameters
    const customerRole = req.query.role ? JSON.parse(req.query.role) : undefined; // Parse the role from the query string
    console.log("customerRole", customerRole);
    
    // Call GetFlyerPreview with customerRole (can be undefined)
    const flyerPreviewData = await GetFlyerPreview(customerRole);
    
    return res.status(200).json({
      success: true,
      data: flyerPreviewData
    });
  } catch (error) {
    console.error("Error fetching flyer preview:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching flyer preview"
    });
  }
}



