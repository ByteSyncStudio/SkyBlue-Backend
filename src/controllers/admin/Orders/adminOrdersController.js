import { getOrderById, listOrders } from "../../../repositories/admin/Orders/adminOrders.js";

export const getallOrders = async (req, res) => {
  try {
    const orders = await listOrders();
    res.status(200).json({
      success: true,
      data: orders,
      message: "Successfully fetched all orders",
    });
  } catch (error) {
    console.error("Error in getallOrders API:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const getSingleOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await getOrderById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error("Error retrieving order:", error);
    res.status(500).json({ message: "Failed to retrieve order" });
  }
};
