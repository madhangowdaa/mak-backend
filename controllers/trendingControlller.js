// controllers\trendingControlller.js
import {
    getTrendingMoviesService,
    setTrendingMovieService,
    removeTrendingMovieService
} from "../services/trendingService.js";

export async function getTrendingMoviesController(req, res) {
    try {
        const { limit = 10 } = req.query;
        const movies = await getTrendingMoviesService(Number(limit));
        res.json({ results: movies });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

export async function setTrendingMovieController(req, res) {
    try {
        const { tmdbID, trendingOrder } = req.body;
        if (!tmdbID) return res.status(400).json({ error: "tmdbID is required" });

        const movie = await setTrendingMovieService(Number(tmdbID), trendingOrder);
        res.json({ message: "✅ Movie added to trending", movie });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

export async function removeTrendingMovieController(req, res) {
    try {
        const { tmdbID } = req.body;
        if (!tmdbID) return res.status(400).json({ error: "tmdbID is required" });

        const movie = await removeTrendingMovieService(Number(tmdbID));
        res.json({ message: "🗑️ Movie removed from trending", movie });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
