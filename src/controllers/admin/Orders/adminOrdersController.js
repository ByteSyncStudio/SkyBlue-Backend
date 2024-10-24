import {
  AddProductOrder,
  getOrderById,
  listOrders,
  updateBillingInfo,
  updateOrderItem,
  updateOrderStatus,
  updatePriceTotal,
  updateShippingMethod,
} from "../../../repositories/admin/Orders/adminOrders.js";

import knex from "../../../config/knex.js";

export const getallOrders = async (req, res) => {
  try {
    const page = req.query.page;
    const size = req.query.size;

    //? Order status search
    const orderStatusId = req.query.orderStatusId;
    if (orderStatusId && ![10, 20, 30, 40].includes(parseInt(orderStatusId))) {
      return res.status(400).json({ error: "Invalid orderStatusId" });
    }

    //? Time
    const startDate = req.query.start ? new Date(req.query.start) : null;
    const endDate = req.query.end ? new Date(req.query.end) : null;
    if (startDate && isNaN(startDate) || endDate && isNaN(endDate)) {
      return res.status(400).json({ message: 'Invalid date format.' });
    }

    const orders = await listOrders(startDate, endDate, orderStatusId, parseInt(page) || 1, parseInt(size) || 25);
    res.status(200).json(orders);
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

// Update order status by ID
export async function UpdateOrderController(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Parse id as integer
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Order ID" });
    }

    // Check if status is provided and update accordingly
    if (status) {
      await updateOrderStatus(orderId, status);
    }

    res
      .status(200)
      .json({ success: true, message: "Order updated successfully" });
  } catch (error) {
    console.error("Error updating order:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update order." });
  }
}

export async function UpdatePriceController(req, res) {
  const { id } = req.params; // Order ID from URL
  const updateData = req.body; // Extract data sent from frontend

  console.log("updateData", updateData);

  try {
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid Order ID" });
    }

    // Dynamically map the frontend fields to backend columns
    const mappedData = {};
    if (updateData.orderSubtotalExclTax !== undefined) mappedData.OrderSubtotalExclTax = updateData.orderSubtotalExclTax;
    if (updateData.orderSubtotalInclTax !== undefined) mappedData.OrderSubtotalInclTax = updateData.orderSubtotalInclTax;
    if (updateData.orderTax !== undefined) mappedData.OrderTax = updateData.orderTax;
    if (updateData.orderDiscount !== undefined) mappedData.OrderDiscount = updateData.orderDiscount;
    if (updateData.orderTotal !== undefined) mappedData.OrderTotal = updateData.orderTotal;

    // Check if mappedData contains any values
    if (Object.keys(mappedData).length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    console.log("mappedData", mappedData);

    // Now, pass this dynamically created object for updating
    await updatePriceTotal(orderId, mappedData);

    res.status(200).json({ success: true, message: "Order updated successfully" });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, message: "Failed to update order." });
  }
}




export async function UpdateBillingInfoController(req, res) {
  console.log("orderid", req.params);
  console.log("Request Body:", req.body);

  const { orderId } = req.params;
  const {
    firstName,
    lastName,
    email,
    phone,
    countryId,
    stateProvinceId,
    address1,
    address2,
    zipPostalCode,
    faxNumber,
    company,
  } = req.body;

  try {
    // Get the CustomerId using the OrderId
    const order = await knex("Order").where({ Id: orderId }).first();

    if (!order) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Order ID" });
    }

    const customerId = order.CustomerId;

    // Update the billing information
    await updateBillingInfo(
      customerId,
      firstName,
      lastName,
      email,
      phone,
      countryId,
      stateProvinceId,
      address1,
      address2,
      zipPostalCode,
      faxNumber,
      company
    );

    res
      .status(200)
      .json({ success: true, message: "Billing info updated successfully" });
  } catch (error) {
    console.error("Error updating billing info:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update billing info." });
  }
}

export async function UpdateShippingMethodController(req, res) {
  const { orderId } = req.params; // Assuming orderId is in the request parameters
  const { shippingMethod } = req.body; // Shipping method should be sent in the request body

  try {
    // Update the shipping method
    await updateShippingMethod(orderId, shippingMethod);

    res
      .status(200)
      .json({ success: true, message: "Shipping method updated successfully" });
  } catch (error) {
    console.error("Error updating shipping method:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update shipping method." });
  }
}

export async function UpdateOrderItemController(req, res) {
  const { orderId, orderItemId } = req.params;
  //console.log("orderId", orderId, orderItemId);
  const {
    quantity,
    unitPriceInclTax,
    unitPriceExclTax,
    priceInclTax,
    priceExclTax,
    discountAmountInclTax,
    discountAmountExclTax,
    originalProductCost,
  } = req.body;

  // Convert IDs to integers
  const parsedOrderId = parseInt(orderId, 10);
  const parsedOrderItemId = parseInt(orderItemId, 10);
  console.log("objectId", parsedOrderId, parsedOrderItemId);

  const updatedFields = {};

  if (quantity !== undefined) updatedFields.Quantity = quantity;
  if (unitPriceInclTax !== undefined)
    updatedFields.UnitPriceInclTax = unitPriceInclTax;
  if (unitPriceExclTax !== undefined)
    updatedFields.UnitPriceExclTax = unitPriceExclTax;
  if (priceInclTax !== undefined) updatedFields.PriceInclTax = priceInclTax;
  if (priceExclTax !== undefined) updatedFields.PriceExclTax = priceExclTax;
  if (discountAmountInclTax !== undefined)
    updatedFields.DiscountAmountInclTax = discountAmountInclTax;
  if (discountAmountExclTax !== undefined)
    updatedFields.DiscountAmountExclTax = discountAmountExclTax;
  if (originalProductCost !== undefined)
    updatedFields.OriginalProductCost = originalProductCost;

  try {
    // Check if the order item exists
    const orderItem = await knex("OrderItem")
      .where({ OrderId: parsedOrderId })
      .andWhere({ ProductId: parsedOrderItemId })
      .first();
    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: `Order item with ID ${orderItemId} not found`,
      });
    }

    console.log("orderItem", orderItem);

    // Validate that the OrderId matches
    if (orderItem.OrderId !== parsedOrderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID does not match the order item.",
      });
    }

    // Update the order item
    await updateOrderItem(parsedOrderItemId, updatedFields, parsedOrderId);

    res
      .status(200)
      .json({ success: true, message: "Order item updated successfully" });
  } catch (error) {
    console.error("Error updating order item:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update order item." });
  }
}

export async function AddProductToOrderController(req, res) {
  const { orderId, productId } = req.params;
  const { customerId, quantity } = req.body;

  try {
    // Validate the input
    if (!customerId) {
      return res.status(400).json({ success: false, message: "Customer ID is required" });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: "Invalid quantity provided" });
    }

    // Call the function to add the product to the order
    await AddProductOrder(orderId, productId, customerId, quantity);
    return res.status(200).json({ success: true, message: "Product added successfully" });
  } catch (error) {
    console.error("Error adding product to order:", error);
    return res.status(500).json({ success: false, message: "Failed to add product to order" });
  }
}

export async function getOrderNotes(req, res) {
  const { orderId } = req.params;

  try {
    // Fetch the order notes
    const notes = await knex("OrderNote")
      .where({ OrderId: orderId })
      .orderBy("CreatedOnUtc", "desc");

    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    console.error("Error fetching order notes:", error);
    res.status(500).json({ success: false, message: "Failed to fetch order notes" });
  }
}
export async function addNewOrderNote(req, res) {

}



export async function addOrderNote(req, res) {
  const { orderId } = req.params;
  const { note, displayToCustomer } = req.body;

  try {
    // Validate input
    if (!note) {
      return res
        .status(400)
        .json({ success: false, message: "Note is required" });
    }

    // Insert the new order note
    await knex("OrderNote").insert({
      OrderId: orderId,
      Note: note,
      DisplayToCustomer: displayToCustomer || false, // Default to false if not provided
      CreatedOnUtc: new Date(),
      DownloadId: 0, // Provide a value for DownloadId
    });

    res
      .status(201)
      .json({ success: true, message: "Order note added successfully" });
  } catch (error) {
    console.error("Error adding order note:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add order note." });
  }
}

export async function deleteOrderNote(req, res) {
  const { id } = req.params; // Get the order note ID from the request parameters

  try {
    // Validate the input
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Order note ID is required" });
    }

    // Delete the order note
    const result = await knex("OrderNote").where({ Id: id }).del();

    if (result === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order note not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Order note deleted successfully" });
  } catch (error) {
    console.error("Error deleting order note:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete order note." });
  }
}
