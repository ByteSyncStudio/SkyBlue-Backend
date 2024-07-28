import express from "express";
import { getCustomers } from "../controllers/customerController.js";

const router = express.Router();

router.get("/top100", getCustomers);

export default router;