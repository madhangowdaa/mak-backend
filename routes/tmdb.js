import express from "express";
import fetch from "node-fetch";

const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

router.get("/movie/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const response = await fetch(
            `${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`
        );

        if (!response.ok) {
            return res.status(500).json({ error: "TMDb fetch failed" });
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
