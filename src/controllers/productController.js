import { bestsellersByQuantity, listCategory, listProductsFromCategory, bestsellersByAmount } from "../repositories/productRepository.js";

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
async function getCategory(req, res) {
    try {
        const category = await listCategory();
        res.json(category);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}


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
async function getProductsFromCategories(req, res) {
    try {
        const categoryId = req.params.category;
        const page = parseInt(req.query.page, 10) || 1;
        const size = parseInt(req.query.size, 10) || 10;
        
        const products = await listProductsFromCategory(categoryId, page, size);
        res.status(200).send(products);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

async function getBestSellersByQuantity(req, res) {
    try {
        const products = await bestsellersByQuantity();
        res.status(200).send(products)
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

async function getBestSellersByAmount(req, res) {
    try {
        const products = await bestsellersByAmount();
        res.status(200).send(products)
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export { getCategory, getProductsFromCategories, getBestSellersByQuantity, getBestSellersByAmount };