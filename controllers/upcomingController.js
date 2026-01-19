// controllers\upcomingController.js
import {
    getUpcomingMoviesService,
    setUpcomingMovieService,
    removeUpcomingMovieService
} from "../services/upcomingService.js";

export async function getUpcomingMoviesController(req, res) {
    try {
        const { limit = 10 } = req.query;
        const movies = await getUpcomingMoviesService(Number(limit));
        res.json({ results: movies });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

export async function setUpcomingMovieController(req, res) {
    try {
        const { tmdbID, upcomingOrder } = req.body;
        if (!tmdbID) return res.status(400).json({ error: "tmdbID is required" });

        const movie = await setUpcomingMovieService(Number(tmdbID), upcomingOrder);
        res.json({ message: "✅ Movie added to trending", movie });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

export async function removeUpcomingMovieController(req, res) {
    try {
        const { tmdbID } = req.body;
        if (!tmdbID) return res.status(400).json({ error: "tmdbID is required" });

        const movie = await removeUpcomingMovieService(Number(tmdbID));
        res.json({ message: "🗑️ Movie removed from trending", movie });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
