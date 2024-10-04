import { listCategory, listProductsFromCategory, listBestsellers, listNewArrivals, listSearchProducts, GetFlatCategories, GetImmediateChildCategories } from "../repositories/productRepository.js";

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
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;
        const sortBy = req.query.sortBy || 'recent';

        // Validate sortBy parameter
        const validSortOptions = ['price_asc', 'price_desc', 'name_asc', 'name_desc', 'recent'];
        if (!validSortOptions.includes(sortBy)) {
            return res.status(400).send('Invalid sort option. Valid options are: ' + validSortOptions.join(', '));
        }

        const products = await listProductsFromCategory(categoryId, page, size, req.user, minPrice, maxPrice, sortBy);
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
    console.log(req.user);
    try {
        if (!req.query.term) {
            res.status(404).send("Search Term is required.");
            return;
        }

        const searchTerm = req.query.term;
        const page = parseInt(req.query.page, 10) || 1;
        const size = parseInt(req.query.size, 10) || 10;
        const category = parseInt(req.params.category, 10);
        const sortBy = req.query.sortBy || 'name_asc'; // Default sort option

        // Validate sortBy parameter
        const validSortOptions = ['price_asc', 'price_desc', 'name_asc', 'name_desc'];
        if (!validSortOptions.includes(sortBy)) {
            return res.status(400).send('Invalid sort option. Valid options are: ' + validSortOptions.join(', '));
        }

        const products = await listSearchProducts(category, searchTerm, page, size, req.user, sortBy);
        res.status(200).send(products);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}


export async function getFlatCategories(req, res) {
    try {
        const result = await GetFlatCategories();
        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export async function getImmediateChildCategories(req, res) {
    try {
        const result = await GetImmediateChildCategories(req.params.id);
        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).send(error.message || 'Server error');
    }
}

export { getCategory, getProductsFromCategories, getBestSellers, getNewArrivals, searchProducts };