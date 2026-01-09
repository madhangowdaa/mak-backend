// controllers/seriesController.js
import {
    addSeriesService,
    getAllSeriesService,
    updateSeriesService,
    deleteSeriesService,
} from '../services/seriesService.js';
import { verifyAdmin } from '../middleware/auth.js';

/**
 * Add a new series
 */
export async function addSeriesController(req, res) {
    try {
        const seriesData = req.body;

        // Verify admin
        verifyAdmin(req, res, () => { });

        const series = await addSeriesService(seriesData);
        res.json({ message: "✅ Series added successfully", series });
    } catch (error) {
        console.error("Add Series Error:", error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Get all series
 */
export async function getAllSeriesController(req, res) {
    try {
        const series = await getAllSeriesService();
        res.json(series);
    } catch (error) {
        console.error("Get Series Error:", error);
        res.status(500).json({ error: "Failed to fetch series" });
    }
}

/**
 * Update series
 * Expects: tmdbID, seasonNumber, language, quality, fileLink
 */
export async function updateSeriesController(req, res) {
    try {
        const updateData = req.body;

        // Verify admin
        verifyAdmin(req, res, () => { });

        const series = await updateSeriesService(updateData);
        res.json({ message: "✏️ Series updated successfully", series });
    } catch (error) {
        console.error("Update Series Error:", error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Delete series / season / quality
 * Expects: tmdbID, optional seasonNumber, language, quality
 */
export async function deleteSeriesController(req, res) {
    try {
        const deleteData = req.body;

        // Verify admin
        verifyAdmin(req, res, () => { });

        const series = await deleteSeriesService(deleteData);
        res.json({ message: `🗑️ Deleted series/season/quality successfully`, series });
    } catch (error) {
        console.error("Delete Series Error:", error);
        res.status(500).json({ error: error.message });
    }
}
