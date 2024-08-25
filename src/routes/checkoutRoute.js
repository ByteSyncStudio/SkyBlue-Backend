import express from "express";
import { checkoutController } from "../controllers/checkoutController.js";
import { authenticateToken, authorizeRoles } from "../middleware/authMiddleware.js"; // Include `authorizeRoles` from the correct path

const router = express.Router(); // Initialize the router

// Apply the authentication middleware
router.use(authenticateToken);

// Define route access with role authorization
const cartAccess = authorizeRoles(["Registered", "Administrators"]);

// Define the checkout route
router.post("/", cartAccess, checkoutController);

export default router;
