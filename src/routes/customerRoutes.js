import express from "express";
import { getCustomerInfo, changePassword, updateCustomerInfo, getCountryList, getStateList, getCustomerOrders, getSingleCustomerOrders } from "../controllers/customerController.js";
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer
 *     description: Customer related endpoints
 * /customer/countries:
 *   get:
 *     summary: Retrieve list of countries
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: List of countries retrieved successfully.
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/countries', getCountryList);

/**
 * @swagger
 * tags:
 *   - name: Customer
 *     description: Customer related endpoints
 * /customer/states/{id}:
 *   get:
 *     summary: Retrieve list of states for a given country
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the country
 *     responses:
 *       200:
 *         description: List of states retrieved successfully.
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/states/:id', getStateList);


// Below APIs will require Token
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   - name: Customer
 *     description: Customer related endpoints
 * /customer/info:
 *   get:
 *     summary: Retrieve customer information
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Customer information retrieved successfully.
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/info', getCustomerInfo);

/**
 * @swagger
 * tags:
 *   - name: Customer
 *     description: Customer related endpoints
 * /customer/change-password:
 *   put:
 *     summary: Change customer password
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: The current password of the customer
 *               newPassword:
 *                 type: string
 *                 description: The new password for the customer
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/change-password', changePassword);

/**
 * @swagger
 * tags:
 *   - name: Customer
 *     description: Customer related endpoints
 * /customer/update-info:
 *   put:
 *     summary: Update customer information
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               FirstName:
 *                 type: string
 *                 description: The first name of the customer
 *               LastName:
 *                 type: string
 *                 description: The last name of the customer
 *               Company:
 *                 type: string
 *                 description: The company of the customer
 *               Address1:
 *                 type: string
 *                 description: The address of the customer
 *               ZipPostalCode:
 *                 type: string
 *                 description: The zip or postal code of the customer
 *               City:
 *                 type: string
 *                 description: The city of the customer
 *               CountryId:
 *                 type: integer
 *                 default: 2
 *                 description: The country ID of the customer
 *               StateProvinceId:
 *                 type: integer
 *                 description: The state or province ID of the customer
 *               PhoneNumber:
 *                 type: string
 *                 description: The phone number of the customer
 *     responses:
 *       200:
 *         description: Customer information updated successfully.
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/update-info', updateCustomerInfo);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Retrieve a list of orders for the authenticated customer
 *     description: Retrieve a list of orders for the authenticated customer, ordered by creation date in descending order.
 *     responses:
 *       200:
 *         description: A list of orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Orders retrieved successfully."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Id:
 *                         type: integer
 *                         description: The order ID.
 *                         example: 1
 *                       CreatedOnUtc:
 *                         type: string
 *                         format: date-time
 *                         description: The date and time when the order was created.
 *                         example: "2023-10-01T12:00:00Z"
 *                       OrderSubtotalInclTax:
 *                         type: number
 *                         description: The order subtotal including tax.
 *                         example: 100.50
 *                       OrderSubtotalExclTax:
 *                         type: number
 *                         description: The order subtotal excluding tax.
 *                         example: 90.00
 *                       OrderTotal:
 *                         type: number
 *                         description: The total amount of the order.
 *                         example: 110.50
 *                       OrderTax:
 *                         type: number
 *                         description: The tax amount of the order.
 *                         example: 10.00
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
 *                   example: "Server error"
 */
router.get('/orders', getCustomerOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Retrieve a single order's items for the authenticated customer
 *     description: Retrieve the items of a single order for the authenticated customer, ordered by creation date in descending order.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The order ID.
 *     responses:
 *       200:
 *         description: The details of the order items.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   OrderItemGuid:
 *                     type: string
 *                     description: The order item GUID.
 *                     example: "123e4567-e89b-12d3-a456-426614174001"
 *                   OrderId:
 *                     type: integer
 *                     description: The order ID.
 *                     example: 1
 *                   ProductId:
 *                     type: integer
 *                     description: The product ID.
 *                     example: 1
 *                   Quantity:
 *                     type: integer
 *                     description: The quantity of the product.
 *                     example: 2
 *                   UnitPriceInclTax:
 *                     type: number
 *                     description: The unit price including tax.
 *                     example: 50.25
 *                   UnitPriceExclTax:
 *                     type: number
 *                     description: The unit price excluding tax.
 *                     example: 45.00
 *                   PriceInclTax:
 *                     type: number
 *                     description: The total price including tax.
 *                     example: 100.50
 *                   PriceExclTax:
 *                     type: number
 *                     description: The total price excluding tax.
 *                     example: 90.00
 *                   ProductName:
 *                     type: string
 *                     description: The name of the product.
 *                     example: "Product Name"
 *                   imageUrl:
 *                     type: string
 *                     description: The URL of the product image.
 *                     example: "http://example.com/image.jpg"
 *       400:
 *         description: Invalid Order ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid Order ID."
 *       404:
 *         description: No order items found for this order ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No order items found for this order ID."
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
router.get('/single-order/:id', getSingleCustomerOrders);

export default router;