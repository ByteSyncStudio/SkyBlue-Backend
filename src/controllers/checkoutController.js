import knex from "../config/knex.js";
import { createCheckoutOrder } from "../repositories/checkoutRepository.js";

export const checkoutController = async (req, res) => {
  const customerId = req.user.id;
  const customerEmail = req.user.email;

  try {
    const addresses = await knex("Address")
      .where("Email", customerEmail)
      .select("Id");

    if (addresses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No address found for the customer.",
      });
    }

    const shippingAddressId = addresses[0].Id;
    const billingAddressId = addresses[1]?.Id || shippingAddressId;

    const orderData = await createCheckoutOrder(
      customerId,
      shippingAddressId,
      billingAddressId
    );

    res.status(201).json({ success: true, orderData });
  } catch (error) {
    console.error("Error processing checkout:", error);
    res.status(500).json({ success: false, message: "Failed to process checkout." });
  }
};
