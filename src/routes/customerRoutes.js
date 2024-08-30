import express from "express";
import { getCustomerInfo, changePassword, updateCustomerInfo } from "../controllers/customerController.js";
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/info', getCustomerInfo);

router.put('/change-password', changePassword)

router.put('/update-info', updateCustomerInfo);

export default router;