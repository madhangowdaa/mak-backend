import express from "express";
import fetch from "node-fetch";
import { getDb } from "../db.js"; // make sure this path is correct

const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// router.get("/movie/:id", async (req, res) => {
//     try {
//         const { id } = req.params;

//         // 1️⃣ Fetch TMDb data
//         const response = await fetch(`${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`);
//         if (!response.ok) return res.status(500).json({ error: "TMDb fetch failed" });
//         const tmdbData = await response.json();

//         // 2️⃣ Fetch DB record
//         const db = await getDb();
//         const dbMovie = await db.collection("movies").findOne({ tmdbID: Number(id) });

//         // 3️⃣ Merge TMDb + DB
//         // const merged = {
//         //     ...tmdbData,
//         //     fileLink: dbMovie?.fileLink || null,
//         //     pinned: dbMovie?.pinned || false,
//         // };
//         const merged = {
//             ...tmdbData,
//             pinned: dbMovie?.pinned || false,
//             ultraLink: dbMovie?.ultraLink
//                 ? { is4K: dbMovie.ultraLink.is4K, size: dbMovie.ultraLink.size }
//                 : null,
//             // fileLink: removed
//             hasFiles: Boolean(dbMovie?.fileLink)
//         };

//         res.json(merged);
//     } catch (err) {
//         console.error("TMDb Merge Error:", err);
//         res.status(500).json({ error: "Server error" });
//     }
// });

router.get("/movie/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const db = await getDb();
        const cache = db.collection("tmdb_cache");

        // 1️⃣ Check cache
        const cached = await cache.findOne({ tmdbID: Number(id) });

        let tmdbData;

        if (cached && (Date.now() - new Date(cached.cachedAt).getTime()) < 24 * 60 * 60 * 1000) {
            // Use cached data
            tmdbData = cached.data;
        } else {
            // Fetch from TMDB
            const response = await fetch(`${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`);
            if (!response.ok) return res.status(500).json({ error: "TMDb fetch failed" });

            tmdbData = await response.json();

            // Save cache
            await cache.updateOne(
                { tmdbID: Number(id) },
                {
                    $set: {
                        tmdbID: Number(id),
                        data: tmdbData,
                        cachedAt: new Date()
                    }
                },
                { upsert: true }
            );
        }

        // 2️⃣ Fetch DB record
        const dbMovie = await db.collection("movies").findOne({ tmdbID: Number(id) });

        // 3️⃣ Merge
        const merged = {
            ...tmdbData,
            pinned: dbMovie?.pinned || false,
            ultraLink: dbMovie?.ultraLink
                ? { is4K: dbMovie.ultraLink.is4K, size: dbMovie.ultraLink.size }
                : null,
            hasFiles: Boolean(dbMovie?.fileLink)
        };

        res.json(merged);

    } catch (err) {
        console.error("TMDb Merge Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
