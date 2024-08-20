import { listCategory } from "../repositories/productRepository.js";

/**
 * @swagger
 * /product/category/all:
 *   get:
 *     summary: Retrieve a list of category
 *     responses:
 *       200:
 *         description: A list of category.
 */
async function getCategory(req, res) {
  try {
    const category = await listCategory();
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}

export { getCategory };
