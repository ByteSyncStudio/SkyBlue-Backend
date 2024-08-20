import express from 'express'
import { getBestSellersByQuantity, getCategory, getProductsFromCategories, getBestSellersByAmount } from '../controllers/productController.js'

const router = express.Router()

// Get Category
router.get("/category/all", getCategory);

// Get Products from Categories
router.get("/:category", getProductsFromCategories);

// Get BestSellers by Quantity
router.get('/bestseller/quantity', getBestSellersByQuantity)

// Get BestSellers by Amount
router.get('/bestseller/amount', getBestSellersByAmount)

export default router