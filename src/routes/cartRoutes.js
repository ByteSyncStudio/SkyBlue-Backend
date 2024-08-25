import express from "express";
import {
  addToCartController,
  getCartItemsController,
  removeSingleCartItemController,
  updateCartController,
} from "../controllers/cartController.js";

import { authenticateToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

const cartAccess = authorizeRoles(['Registered', 'Administrators']);

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Cart related endpoints
 * /cart/add:
 *   post:
 *     summary: Add a product to the cart
 *     tags: [Cart]
 *     description: Adds a new product to the shopping cart for the authenticated customer.
 *     requestBody:
 *       description: Product and cart details to be added.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: The ID of the product to add.
 *               quantity:
 *                 type: integer
 *                 description: The quantity of the product to add.
 *             required:
 *               - productId
 *               - quantity
 *     responses:
 *       201:
 *         description: Product added to the cart successfully.
 *       400:
 *         description: Invalid input data.
 *       500:
 *         description: Server error.
 */
router.post("/add", cartAccess, addToCartController);

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Cart related endpoints
 * /cart/items:
 *   get:
 *     summary: Get all cart items for the authenticated customer
 *     tags: [Cart]
 *     description: Retrieves all items currently in the shopping cart for the authenticated customer.
 *     responses:
 *       200:
 *         description: Successfully retrieved cart items.
 *       500:
 *         description: Server error.
 */
router.get("/items", cartAccess, getCartItemsController);

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Cart related endpoints
 * /cart/update:
 *   put:
 *     summary: Update a cart item
 *     tags: [Cart]
 *     description: Updates the quantity or other details of a cart item.
 *     requestBody:
 *       description: Cart item details to update.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: The ID of the cart item to update.
 *               quantity:
 *                 type: integer
 *                 description: The new quantity for the cart item.
 *               shoppingCartTypeId:
 *                 type: integer
 *                 description: The type of the shopping cart (optional).
 *             required:
 *               - id
 *               - quantity
 *     responses:
 *       200:
 *         description: Cart item updated successfully.
 *       400:
 *         description: Invalid input data or exceeds product limits.
 *       500:
 *         description: Server error.
 */
router.put("/update", cartAccess, updateCartController);

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Cart related endpoints
 * /cart/remove/{id}:
 *   delete:
 *     summary: Remove a single cart item
 *     tags: [Cart]
 *     description: Deletes a specific item from the shopping cart.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the cart item to remove.
 *     responses:
 *       200:
 *         description: Cart item removed successfully.
 *       404:
 *         description: Cart item not found.
 *       500:
 *         description: Server error.
 */
router.delete("/remove/:id", cartAccess, removeSingleCartItemController);

export default router;
