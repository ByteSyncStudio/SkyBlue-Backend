import knex from "../../../config/knex.js";
import { getAllPermissionsWithRoles } from "../../../repositories/admin/configurations/configurationsRepo.js";

export const getShippingMethods = async (req, res) => {
  try {
    const shippingMethods = await knex("ShippingMethod").select("*");
    if (shippingMethods.length === 0) {
      return res.status(404).json({ message: "No shipping methods found" });
    }
    res.status(200).send({ success: true, shippingMethods });
  } catch (error) {
    console.log("Something went wrong on getShippingMethods", error);
    res.status(400).json({ message: error.message });
  }
};

export const addShippingMethod = async (req, res) => {
  try {
    const { Name, DisplayOrder, Description } = req.body;
    if (!Name || !DisplayOrder) {
      return res
        .status(400)
        .json({ message: "Name and DisplayOrder are required" });
    }
    await knex("ShippingMethod").insert({
      Name: Name,
      DisplayOrder: DisplayOrder,
      Description: Description, // Handle the case where description might be missing
    });

    res.status(201).send({ success: true, message: "Shipping method added" });
  } catch (error) {
    console.log("Something went wrong on addShippingMethod", error);
    res.status(400).json({ message: error.message });
  }
};

export const deleteShippingMethod = async (req, res) => {
  const { methodId } = req.body; // Assume methodId is sent in the request body
  if (!methodId) {
    return res
      .status(400)
      .json({ success: false, message: "Shipping method ID is required" });
  }

  try {
    // Perform database operation to delete the shipping method
    const result = await knex("ShippingMethod").where("id", methodId).del();

    if (result) {
      return res.status(200).json({
        success: true,
        message: "Shipping method deleted successfully",
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Shipping method not found" });
    }
  } catch (error) {
    console.error("Error deleting shipping method:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the shipping method",
    });
  }
};

export const updateShippingMethodofOrder = async (req, res) => {
  const { id, Name, DisplayOrder, Description } = req.body;
  if (!id) {
    return res.status(400).json({ message: "Shipping method ID is required" });
  }

  try {
    const result = await knex("ShippingMethod").where("id", id).update({
      Name: Name,
      DisplayOrder: DisplayOrder,
      Description: Description,
    });

    if (result) {
      return res.status(200).json({
        success: true,
        message: "Shipping method updated successfully",
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Shipping method not found" });
    }
  } catch (error) {
    console.error("Error updating shipping method:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the shipping method",
    });
  }
};

export const getContentManagementSystem = async (req, res) => {
  try {
    const data = await getAllPermissionsWithRoles();
    res.status(200).send({ message: "success true", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
