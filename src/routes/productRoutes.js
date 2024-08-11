import express from 'express'
import { getCategory } from '../controllers/productController.js'

const router = express.Router()

//getCategory
router.get("/category/all",getCategory)

export default router