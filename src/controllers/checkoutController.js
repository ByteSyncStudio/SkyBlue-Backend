import knex from "../config/knex.js";
import { createCheckoutOrder } from "../repositories/checkoutRepository.js";

export const updateShippingController = async (req, res) => {
  try {
    const customerId = req.user.id;
    const {newShippingMethodId} = req.body;

    if (!customerId || !newShippingMethodId) {
      return res.status(400).json({ success: false, message: 'CustomerId and newShippingMethodId are required.' });
    }

    // Update the shipping method for all items in the customer's cart
    await knex('ShoppingCartItem')
      .where('CustomerId', customerId)
      .update({ ShoppingCartTypeId: newShippingMethodId });

    return res.json({ success: true, message: 'Shipping method updated successfully for all cart items.' });
  } catch (error) {
    console.error('Error updating shipping method:', error);
    return res.status(500).json({ success: false, message: 'Failed to update shipping method.' });
  }
};

export const checkoutController = async (req, res) => {
  try {
    const customerId = req.user.id; // Assuming the user ID is stored in req.user.id

    // Query the Customer table to get the email
    const customer = await knex("Customer")
      .where({ Id: customerId })
      .select("Email")
      .first();

    if (!customer) {
      throw new Error(`Customer not found for ID: ${customerId}`);
    }

    const customerEmail = customer.Email;

    console.log(`Customer Email: ${customerEmail}`);

    //testing
    //const customerId = 46097 
    //const customerEmail = "hastymarket210@gmail.com"

    const trx = await knex.transaction();

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
        req.headers['x-forwarded-for'] || // Header used by most proxies
        req.socket.remoteAddress ||
        null;

      // If the IP address is in IPv6 format (e.g., "::ffff:192.168.1.1"), convert it to IPv4
      if (ip && ip.includes('::ffff:')) {
        return ip.split('::ffff:')[1];
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
      customerIps,
      trx
    );

    await trx.commit();

    res.status(201).json({ success: true, orderData });
  } catch (error) {
    console.error("Error processing checkout:", error);
    res.status(500).json({ success: false, message: "Failed to process checkout." });
  }
};
