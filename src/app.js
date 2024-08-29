import express from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerSetup from "./config/swagger.js";
import customerRoutes from "./routes/customerRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoute from "./routes/cartRoutes.js";
import checkoutRoute from "./routes/checkoutRoute.js";
import adminRoutes from "./routes/admin/adminRoutes.js"

const app = express();

app.use(cors());

// Security Middleware
app.use(helmet());

// Parse JSON
app.use(express.json());

// Setup Swagger for API documentation; See endpoint: /api-docs
swaggerSetup(app);

// Endpoints
app.use("/customers", customerRoutes);
app.use("/auth", authRoutes);
app.use("/product", productRoutes);
app.use("/cart", cartRoute);
app.use("/checkout", checkoutRoute);
app.use("/admin", adminRoutes);

// (Loose) Error Catcher
app.use((err, req, res, next) => {
  console.error("Error stack:", err.stack);
  console.error("Error message:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;