import { createCheckoutOrder } from "../repositories/checkoutRepo.js";

export const checkoutController = async (req, res) => {
  // For this example, we'll assume you have billingAddressId as a constant or you can get it from the request body if provided.
  const shippingAddressId = 50598; // You may need to get this from req.body if it's dynamic
  const billingAddressId = 12345; // Replace with actual value or fetch from req.body if available
  
  console.log("shippingAddressId:", shippingAddressId);
  const customerId = req.user.id; // Retrieved from middleware
  console.log("Customer ID from controller:", customerId);
  
  console.log("Request Body:", req.body);
  
  // Optional: Fetch payment details from request body if available
  const paymentDetails = req.body.paymentDetails || {}; // Assumes payment details are passed in the request body
  
  try {
    // Create checkout order
    const orderData = await createCheckoutOrder(customerId, shippingAddressId, billingAddressId, paymentDetails);
    res.status(201).json({ success: true, orderData });
  } catch (error) {
    console.error("Error processing checkout:", error);
    res.status(500).json({ success: false, message: "Failed to process checkout." });
  }
};
