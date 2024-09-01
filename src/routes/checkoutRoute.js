import express from "express";
import { checkoutController } from "../controllers/checkoutController.js";
import { authenticateToken, authorizeRoles } from "../middleware/authMiddleware.js"; // Include `authorizeRoles` from the correct path

const router = express.Router(); // Initialize the router

// Apply the authentication middleware
router.use(authenticateToken);

// Define route access with role authorization
const cartAccess = authorizeRoles(["Registered", "Administrators"]);

/**
 * @swagger
 * tags:
 *   - name: Checkout
 *     description: Checkout related endpoints
 * /checkout:
 *   post:
 *     summary: Process a checkout for the authenticated customer
 *     tags: [Checkout]
 *     description: Processes the checkout for the authenticated customer, updating the shipping method and creating an order.
 *     requestBody:
 *       description: Details required for processing the checkout.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newShippingMethodId:
 *                 type: integer
 *                 description: The new shipping method ID to be applied to the cart items.
 *             required:
 *               - newShippingMethodId
 *     responses:
 *       201:
 *         description: Checkout processed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 orderData:
 *                   type: object
 *                   description: The details of the created order.
 *       400:
 *         description: Invalid input data or missing required fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "newShippingMethodId are required."
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to process checkout."
 */
router.post("/", cartAccess, checkoutController);

export default router;