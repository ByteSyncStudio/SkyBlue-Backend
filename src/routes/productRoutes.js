import express from 'express';
import { getCategory, getProductsFromCategories, getBestSellers } from '../controllers/productController.js';

const router = express.Router();

/**
 * @swagger
 * /category/all:
 *   get:
 *     summary: Retrieve a list of all categories
 *     responses:
 *       200:
 *         description: A list of categories.
 *       500:
 *         description: Internal server error
 */
router.get("/category/all", getCategory);

/**
 * @swagger
 * /product/{categoryId}:
 *   get:
 *     summary: Retrieve a list of products from a category
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the category
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         description: The page number
 *       - in: query
 *         name: size
 *         required: false
 *         schema:
 *           type: integer
 *         description: The number of items per page
 *     responses:
 *       200:
 *         description: A list of products.
 *       500:
 *         description: Internal server error
 */
router.get("/category/:category", getProductsFromCategories);

/**
 * @swagger
 * /bestseller:
 *   get:
 *     summary: Retrieve bestsellers sorted by quantity or amount
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           enum: [quantity, amount]
 *         description: Sort bestsellers by quantity or amount
 *     responses:
 *       200:
 *         description: A list of bestselling products.
 *       500:
 *         description: Internal server error
 */
router.get('/bestseller', getBestSellers);

export default router;