// controllers\upcomingController.js
import {
    getUpcomingMoviesService,
    setUpcomingMovieService,
    removeUpcomingMovieService
} from "../services/upcomingService.js";

/* ================= GET UPCOMING MOVIES ================= */
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

/* ================= ADD / UPDATE UPCOMING ================= */
export async function setUpcomingMovieController(req, res) {
    try {
        const { tmdbID, upcomingOrder, ott_release } = req.body;

        if (!tmdbID) {
            return res.status(400).json({ error: "tmdbID is required" });
        }

        const movie = await setUpcomingMovieService(
            Number(tmdbID),
            upcomingOrder,
            ott_release
        );

        res.json({ message: "✅ Movie added to upcoming", movie });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

/* ================= REMOVE UPCOMING ================= */
export async function removeUpcomingMovieController(req, res) {
    try {
        const { tmdbID } = req.body;

        if (!tmdbID) {
            return res.status(400).json({ error: "tmdbID is required" });
        }

        const movie = await removeUpcomingMovieService(Number(tmdbID));
        res.json({ message: "🗑️ Movie removed from upcoming", movie });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
