import { listCategory } from "../repositories/productRepository.js";

/**
 * @swagger
 * /category/all
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


export { getCategory };