// routes\stats.js
import express from "express";
import { getFooterStatsController } from "../controllers/statsController.js";

const router = express.Router();

/**
 * GET /api/stats/footer
 */
router.get("/stats/footer", getFooterStatsController);

export default router;
