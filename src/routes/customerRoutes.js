import express from "express";
import { getCustomerInfo, changePassword, updateCustomerInfo, getCountryList, getStateList } from "../controllers/customerController.js";
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

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

export default router;