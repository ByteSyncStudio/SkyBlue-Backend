import knex from "../config/knex.js";
import { createCheckoutOrder } from "../repositories/checkoutRepository.js";

export const checkoutController = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const customerId = req.user.id; // Assuming the user ID is stored in req.user.id

    // Ensure the shipping method is updated before proceeding
    const { newShippingMethodId } = req.body;

    if (!newShippingMethodId) {
      return res
        .status(400)
        .json({ success: false, message: "newShippingMethodId are required." });
    }

    // Update the shipping method for all items in the customer's cart
    await knex("ShoppingCartItem")
      .where("CustomerId", customerId)
      .update({ ShoppingCartTypeId: newShippingMethodId });

    // Query the Customer table to get the email
    const customer = await trx("Customer")
      .where({ Id: customerId })
      .select("Email")
      .first();

    if (!customer) {
      await trx.rollback();
      throw new Error(`Customer not found for ID: ${customerId}`);
    }

    const customerEmail = customer.Email;

    console.log(`Customer Email: ${customerEmail}`);

    const addresses = await trx("Address")
      .where("Email", customerEmail)
      .select("Id");

    if (addresses.length === 0) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        message: "No address found for the customer.",
      });
    }

    const shippingAddressId = addresses[0].Id;
    const billingAddressId = addresses[1]?.Id || shippingAddressId;

    function getClientIp(req) {
      const ip =
        req.headers["x-forwarded-for"] || // Header used by most proxies
        req.socket.remoteAddress ||
        null;

      // If the IP address is in IPv6 format (e.g., "::ffff:192.168.1.1"), convert it to IPv4
      if (ip && ip.includes("::ffff:")) {
        return ip.split("::ffff:")[1];
      }

      return ip;
    }

    const customerIps = getClientIp(req);
    console.log(customerIps);

    const orderData = await createCheckoutOrder(
      customerId,
      customerEmail,
      shippingAddressId,
      billingAddressId,
      customerIps
    );

    await trx.commit();

    res.status(201).json({ success: true, orderData });
  } catch (error) {
    await trx.rollback();
    console.error("Error processing checkout:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to process checkout." });
  }
};
