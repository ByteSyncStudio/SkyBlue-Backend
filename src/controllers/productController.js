import { listCategory, listProductsFromCategory } from "../repositories/productRepository.js";

/**
 * @swagger
 * /category/all:
 *   get:
 *     summary: Retrieve a list of top 100 listCategory
 *     responses:
 *       200:
 *         description: A list of customers.
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


async function getProductsFromCategories(req, res) {
    try {
        const categoryName = req.params.category;
        const page = parseInt(req.query.page, 10) || 1;
        const size = parseInt(req.query.size, 10) || 10;
        console.log(categoryName)
        
        const products = await listProductsFromCategory(categoryName, page, size);
        res.status(200).send(products);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export { getCategory, getProductsFromCategories };