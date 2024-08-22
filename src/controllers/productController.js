import { listCategory, listProductsFromCategory, listBestsellers, listNewArrivals, listSearchProducts } from "../repositories/productRepository.js";
import { generateImageUrl } from "../utils/imageUtils.js";

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
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

async function getProductsFromCategories(req, res) {
    try {
        const categoryId = parseInt(req.params.category);
        const page = parseInt(req.query.page, 10) || 1;
        const size = parseInt(req.query.size, 10) || 10;

        const products = await listProductsFromCategory(categoryId, page, size);
        res.status(200).send(products);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

async function getBestSellers(req, res) {
    try {
        const sortBy = req.query.sortBy || 'quantity';
        const size = req.query.size || 5;
        const products = await listBestsellers(sortBy, size);
        res.status(200).send(products)
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

async function getNewArrivals(req, res) {
    try {
        const size = req.query.size || 5;
        const data = await listNewArrivals(size);

        const products = data.map(product => {
            let image = null;
            if (product.PictureId) {
                image = generateImageUrl(product.PictureId, product.MimeType);
            }

            return {
                data: {
                    Id: product.Id,
                    Name: product.Name,
                    Price: product.Price,
                    FullDescription: product.FullDescription,
                    ShortDescription: product.ShortDescription,
                    OrderMinimumQuantity: product.OrderMinimumQuantity,
                    OrderMaximumQuantity: product.OrderMaximumQuantity,
                    Stock: product.Stock,
                    Image: image
                }
            };
        });

        res.status(200).send(products);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

async function searchProducts(req, res) {
    try {
        if (!req.query.term) {
            res.status(404).send("Search Term is required.")
            return
        }

        const searchTerm = req.query.term;
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 10;
        const category = parseInt(req.params.category);
        const products = await listSearchProducts(category, searchTerm, page, size);

        res.status(200).send(products);
    }
    catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export { getCategory, getProductsFromCategories, getBestSellers, getNewArrivals, searchProducts };