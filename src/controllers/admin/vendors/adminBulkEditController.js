import knex from "../../../config/knex.js";
import { BulkDeleteProducts, EditBulkProduct, GetBulkEdit } from "../../../repositories/admin/vendor/bulkRepository.js";

export async function getBulkProducts(req, res) {
  try {
    const {
      categoryId,
      categoryName,
      productName,
      manufacturer,
      vendor,
      published,
      size,
      page,
    } = req.query;

    // Ensure to pass the new size of 25 in the query
    const result = await GetBulkEdit(
      parseInt(categoryId),
      categoryName,
      productName,
      manufacturer,
      vendor,
      parseInt(published),
      parseInt(page) || 1,
      parseInt(size) || 25 // Set to 25 items per page
    );

    res.status(200).send({
      success: true,
      message: "Products fetched successfully",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error fetching bulk products",
      error,
    });
  }
}


export async function updateBulkEdit(req, res) {
  const {changes} = req.body;
  try {
    const result = await EditBulkProduct(changes);
    res.status(200).send({
      success: true,
      message: "Products updated successfully",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error updating bulk products",
      error,
    });
  }
}

export async function bulkDeleteProducts(req, res) {
  try {
    const { productIds } = req.body;
    if (!productIds || !productIds.length) {
      return res.status(400).send({
        success: false,
        message: "Product IDs are required",
      });
    }

    const result = await BulkDeleteProducts(productIds);
    res.status(200).send({
      success: true,
      message: "Products deleted successfully",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error updating bulk products",
      error,
    });
  }
}