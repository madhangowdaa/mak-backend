// controllers/seriesController.js
import {
    addSeriesService,
    getSeriesService,
    updateSeriesService,
    deleteSeriesService,
} from '../services/seriesService.js';
import { verifyAdmin } from '../middleware/auth.js';

// ---------------- Get series with pagination/search/sort ----------------
export async function getSeriesController(req, res) {
    try {
        const { page, limit, q, sort } = req.query;
        const series = await getSeriesService({
            page: Number(page) || 1,
            limit: Number(limit) || 20,
            q: q || "",
            sort: sort || "latest"
        });
        res.json(series);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch series" });
    }
}

// ---------------- Add series ----------------
export async function addSeriesController(req, res) {
    try {
        verifyAdmin(req, res, async () => {
            const series = await addSeriesService(req.body, req.body.options);
            res.json({ message: "✅ Series added successfully", series });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// ---------------- Update series ----------------
export async function updateSeriesController(req, res) {
    try {
        verifyAdmin(req, res, async () => {
            const series = await updateSeriesService(req.body, req.body.options);
            res.json({ message: "✏️ Series updated successfully", series });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// ---------------- Delete series ----------------
export async function deleteSeriesController(req, res) {
    try {
        verifyAdmin(req, res, async () => {
            const series = await deleteSeriesService(req.body);
            res.json({ message: `🗑️ Deleted series/season/quality successfully`, series });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
