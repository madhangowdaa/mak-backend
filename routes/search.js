// routes\search.js
import express from "express";
import { globalSearchController } from "../controllers/searchController.js";

const router = express.Router();

// GET /api/search?q=batman
router.get("/search", globalSearchController);

export default router;
