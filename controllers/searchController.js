// controllers\searchController.js
import { globalSearchService } from "../services/searchService.js";

export async function globalSearchController(req, res) {
    try {
        const { q, limit = 10 } = req.query;

        if (!q) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const results = await globalSearchService(q, Number(limit));

        res.json(results);
    } catch (error) {
        console.error("Global search error:", error);
        res.status(500).json({ error: "Global search failed" });
    }
}
