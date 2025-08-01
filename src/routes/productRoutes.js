import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { getCategory, getProductsFromCategories, getBestSellers, getNewArrivals, searchProducts, getFlatCategories, getImmediateChildCategories } from '../controllers/productController.js';
import { getSliderByType } from '../controllers/admin/slider/adminSliderController.js';
import { getAllCategories } from "../controllers/admin/category/adminCategoryController.js";

const router = express.Router();

router.use(authenticateToken);

const productAccess = authorizeRoles(['Registered', 'Administrators'])

/**
 * @swagger
 * tags:
 *   - name: Product
 *     description: Product related endpoints
 * /product/category/all:
 *   get:
 *     summary: Retrieve a list of all categories
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: A list of categories.
 *       500:
 *         description: Internal server error
 */
router.get("/category/all", getCategory);


/**
 * @swagger
 * tags:
 *   - name: Product
 *     description: Product related endpoints
 * /product/bestseller:
 *   get:
 *     summary: Retrieve bestsellers sorted by quantity or amount
 *     tags: [Product]
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
 * tags:
 *   - name: Product
 *     description: Product related endpoints
 * /product/newarrivals:
 *   get:
 *     summary: Retrieve a list of all New Arrival products
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: A list of products.
 *       500:
 *         description: Internal server error
*/
router.get('/newarrivals', getNewArrivals)

/**
 * @swagger
 * tags:
 *   - name: Product
 *     description: Product related endpoints
 * /product/search/{category}:
 *   get:
 *     summary: Search products by category
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the category (-1 to search every product i.e. Miscellaneous Item)
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

router.get('/categories-flat', getFlatCategories)

/**
 * @swagger
 * /admin/slider/{type}:
 *   get:
 *     summary: Get sliders by type
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sliders fetched successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
*/
router.get("/slider/:type", getSliderByType);

router.get('/category/child/:id', getImmediateChildCategories)

router.get("/category/tree", getAllCategories);

/**
 * @swagger
 * tags:
 *   - name: Product
 *     description: Product related endpoints
 * /product/category/{categoryId}:
 *   get:
 *     summary: Retrieve a list of products from a category
 *     tags: [Product]
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

export default router;