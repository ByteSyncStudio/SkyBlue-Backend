import express from "express";
import {
  addToCartController,
  getCartItemsController,
  removeAllCartItemsController,
  removeSingleCartItemController,
  updateCartController,
} from "../controllers/cartController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Cart related endpoints
 * /cart/add:
 *   post:
 *     summary: Add a product to the cart
 *     tags: [Cart]
 *     description: Adds a new product to the shopping cart for a customer.
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
router.post("/add", addToCartController);

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Cart related endpoints
 * /cart/items/{customerId}:
 *   get:
 *     summary: Get all cart items for a customer
 *     tags: [Cart]
 *     description: Retrieves all items currently in the shopping cart for a specific customer.
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the customer whose cart items are to be retrieved.
 *     responses:
 *       200:
 *         description: Successfully retrieved cart items.
 *       500:
 *         description: Server error.
 */
router.get("/items/:customerId", getCartItemsController);

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
 *               productId:
 *                 type: integer
 *                 description: The ID of the product to update (must match the original product).
 *               shoppingCartTypeId:
 *                 type: integer
 *                 description: The type of the shopping cart (optional).
 *             required:
 *               - id
 *               - quantity
 *               - productId
 *     responses:
 *       200:
 *         description: Cart item updated successfully.
 *       400:
 *         description: Invalid input data or exceeds product limits.
 *       500:
 *         description: Server error.
 */
router.put("/update", updateCartController);

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Cart related endpoints
 * /cart/remove-all/{customerId}:
 *   delete:
 *     summary: Remove all cart items for a customer
 *     tags: [Cart]
 *     description: Deletes all items from the shopping cart for a specific customer.
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the customer whose cart items are to be removed.
 *     responses:
 *       200:
 *         description: All cart items removed successfully.
 *       404:
 *         description: No cart items found for the customer.
 *       500:
 *         description: Server error.
 */
router.delete("/remove-all/:customerId", removeAllCartItemsController);

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
router.delete("/remove/:id", removeSingleCartItemController);

export default router;