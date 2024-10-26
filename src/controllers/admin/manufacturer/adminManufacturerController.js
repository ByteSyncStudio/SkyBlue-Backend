import {
  AddManufacturer,
  AddProductManufacturer,
  DeleteManufacturer,
  DeleteManufacturerProduct,
  EditManufacturer,
  GetAllManufacturers,
  GetManufacturersProducts,
} from "../../../repositories/admin/manufacturer/adminManufacturerRepository.js";

export async function getAllManufacturers(req, res) {
  try {
    const { name } = req.query;
    const data = await GetAllManufacturers(name);
    res.status(200).send(data);
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(error.statusCode || 500).send({
      success: false,
      message: error.message || "Server error",
    });
  }
}

export async function getManufacturersProducts(req, res) {
  try {
    res.status(200).send(await GetManufacturersProducts(req.params.id));
  } catch (error) {
    console.error("Error fetching manufacturer products:", error);
    res.status(error.statusCode || 500).send({
      success: false,
      message: error.message || "Server error",
    });
  }
}

export async function addManufacturer(req, res) {
  try {
    const { Name, Description } = req.body;

    res.status(200).send(await AddManufacturer(Name, Description));
  } catch (error) {
    console.error("Error adding manufacturers:", error);
    res.status(error.statusCode || 500).send({
      success: false,
      message: error.message || "Server error",
    });
  }
}

export async function editManufacturer(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    res.status(200).send(await EditManufacturer(id, updates));
  } catch (error) {
    console.error("Error editing manufacturer:", error);
    res.status(error.statusCode || 500).send({
      success: false,
      message: error.message || "Server error",
    });
  }
}

export async function deleteManufacturer(req, res) {
  try {
    const { id } = req.params;
    res.status(200).send(await DeleteManufacturer(id));
  } catch (error) {
    console.error("Error editing manufacturer:", error);
    res.status(error.statusCode || 500).send({
      success: false,
      message: error.message || "Server error",
    });
  }
}

export async function addProductManufacturerController(req, res) {
  try {
    const { manufacturerId } = req.params;
    const { productId, isFeaturedProduct = false, displayOrder = 0 } = req.body;

    console.log(manufacturerId, productId, isFeaturedProduct, displayOrder);

    await AddProductManufacturer({
      productId,
      manufacturerId,
      isFeaturedProduct,
      displayOrder,
    });

    res.status(201).send({
      success: true,
      message: "Product manufacturer mapping added successfully",
    });
  } catch (error) {
    console.error("Error adding product manufacturer:", error);
    res.status(error.statusCode || 500).send({
      success: false,
      message: error.message || "Server error",
    });
  }
}

export async function deleteManufacturerProductController(req, res) {
    const { productId, manufacturerId } = req.params;
    console.log(productId, manufacturerId); // Log for debugging
  
    try {
      // Call the delete function and capture the result
      const result = await DeleteManufacturerProduct(productId, manufacturerId);
      
      // Send the appropriate response based on the result
      if (result.success) {
        res.status(200).send({
          success: true,
          message: "Product deleted successfully",
          result,
        });
      } else {
        res.status(404).send({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error("Error deleting manufacturer product:", error);
      res.status(error.statusCode || 500).send({
        success: false,
        message: error.message || "Server error",
      });
    }
  }