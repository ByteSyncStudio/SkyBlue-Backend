import express from "express";
import {
  addToCartController,
  getCartItemsController,
  removeAllCartItemsController,
  removeSingleCartItemController,
  updateCartController,
} from "../controllers/cartController.js";
import jsonwebtoken from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

const router = express.Router();

//to send userId on req objext
const autheticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("autHeader", authHeader);

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Invalid token
      }

      req.user = user; // Attach user info to the request object
      next();
    });
  } else {
    res.sendStatus(401); // No token provided
  }
};

//add to cart
router.post("/add", addToCartController);
//getting cart items
router.get("/items/:customerId", getCartItemsController);
//update cart
router.put("/update", updateCartController);

// Route to remove all cart items for a customer
router.delete("/remove-all/:customerId", removeAllCartItemsController);

// Route to remove a single cart item by ID
router.delete("/remove/:id", removeSingleCartItemController);

export default router;
