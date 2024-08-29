import { listCategory, listProductsFromCategory, listBestsellers, listNewArrivals, listSearchProducts } from "../repositories/productRepository.js";

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
    console.log(req.user)
    try {
        const categoryId = parseInt(req.params.category);
        const page = parseInt(req.query.page, 10) || 1;
        const size = parseInt(req.query.size, 10) || 10;

        const products = await listProductsFromCategory(categoryId, page, size, req.user);
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
        const products = await listBestsellers(sortBy, size, req.user);
        res.status(200).send(products)
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

async function getNewArrivals(req, res) {
    try {
        const size = req.query.size || 5;
        const products = await listNewArrivals(size, req.user);
        res.status(200).send(products.map(product => ({ data: product })));
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

async function searchProducts(req, res) {
    console.log(req.user)
    try {
        if (!req.query.term) {
            res.status(404).send("Search Term is required.")
            return
        }

        const searchTerm = req.query.term;
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 10;
        const category = parseInt(req.params.category);
        const products = await listSearchProducts(category, searchTerm, page, size, req.user);

        res.status(200).send(products);
    }
    catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export { getCategory, getProductsFromCategories, getBestSellers, getNewArrivals, searchProducts };