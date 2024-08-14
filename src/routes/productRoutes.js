import express from 'express'
import { getCategory, getProductsFromCategories } from '../controllers/productController.js'

const router = express.Router()

// Get Category
router.get("/category/all", getCategory);

// Get Products from Categories
router.get("/:category", getProductsFromCategories);

export default router