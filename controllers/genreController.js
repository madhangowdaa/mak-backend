// controllers\genreController.js
import {
    getGenrePreviewService,
    getMoviesByGenreService,
    getGenresWithCountService,
} from "../services/genreService.js";

/* ================= GENRE PREVIEW ================= */

export async function getGenrePreviewController(req, res) {
    try {
        const { genre } = req.params;
        const { limit = 10 } = req.query;

        const movies = await getGenrePreviewService(genre, Number(limit));
        res.json({ results: movies });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch genre preview" });
    }
}

/* ================= MOVIES BY GENRE ================= */

export async function getMoviesByGenreController(req, res) {
    try {
        const { genre } = req.params;
        const { page = 1, limit = 20, sort = "latest" } = req.query;

        const data = await getMoviesByGenreService({
            genre,
            page: Number(page),
            limit: Number(limit),
            sort,
        });

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch genre movies" });
    }
}


export async function getGenresWithCountController(req, res) {
    try {
        const genres = await getGenresWithCountService();
        res.json({ results: genres });
    } catch (err) {
        console.error("Failed to fetch genres:", err);
        res.status(500).json({ error: "Failed to fetch genres" });
    }
}
