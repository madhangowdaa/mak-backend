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

        const tmdbID = Number(req.params.id);

        const db = await getDb();
        const cache = db.collection("tmdb_cache");

        const cached = await cache.findOne({ tmdbID });

        let tmdbData;

        if (cached) {

            const age = Date.now() - new Date(cached.cachedAt).getTime();

            if (age < 24 * 60 * 60 * 1000) {
                // fresh cache
                tmdbData = cached.data;

            } else {
                // expired cache but still usable
                tmdbData = cached.data;

                // refresh in background
                fetch(`${BASE_URL}/movie/${tmdbID}?api_key=${TMDB_API_KEY}`)
                    .then(r => r.json())
                    .then(data => {
                        cache.updateOne(
                            { tmdbID },
                            { $set: { data, cachedAt: new Date() } }
                        );
                    })
                    .catch(console.error);
            }

        } else {

            // no cache → fetch from TMDB
            const response = await fetch(`${BASE_URL}/movie/${tmdbID}?api_key=${TMDB_API_KEY}`);

            if (!response.ok) {
                return res.status(500).json({ error: "TMDb fetch failed" });
            }

            tmdbData = await response.json();

            await cache.insertOne({
                tmdbID,
                data: tmdbData,
                cachedAt: new Date()
            });
        }

        const dbMovie = await db.collection("movies").findOne({ tmdbID });

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
