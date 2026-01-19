// controllers\statsController.js
import { getFooterStatsService } from "../services/statsService.js";

export async function getFooterStatsController(req, res) {
    try {
        const stats = await getFooterStatsService();
        res.json(stats);
    } catch (err) {
        console.error("Footer stats error:", err);
        res.status(500).json({ error: "Failed to fetch footer stats" });
    }
}
