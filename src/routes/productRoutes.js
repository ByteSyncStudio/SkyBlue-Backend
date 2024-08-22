import express from 'express';
import { getCategory, getProductsFromCategories, getBestSellers, getNewArrivals, searchProducts } from '../controllers/productController.js';

const router = express.Router();

/**
 * @swagger
 * product/category/all:
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
 * /product/category/{categoryId}:
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
 * /product/bestseller:
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

/**
 * @swagger
 * /product/newarrivals:
 *   get:
 *     summary: Retrieve a list of all New Arrival products
 *     responses:
 *       200:
 *         description: A list of products.
 *       500:
 *         description: Internal server error
 */
router.get('/newarrivals', getNewArrivals)

/**
 * @swagger
 * /product/search/{category}:
 *   get:
 *     summary: Search for products within a category
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the category (-1 to search every product i.e. Miscellaneous Item)
 *       - in: query
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *         description: The search term
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
 *         description: A list of products matching the search criteria.
 *       404:
 *         description: Search Term is required.
 *       500:
 *         description: Internal server error
 */
router.get('/search/:category', searchProducts)

export default router;