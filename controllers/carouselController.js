// controllers/carouselController.js
import { getDb } from "../db.js";
import { fetchMovieFromTMDB } from "../utils/tmdb.js";

export async function getCarouselController(req, res) {
    const db = await getDb();
    const slides = await db.collection("carousel").find({ isActive: true }).sort({ order: 1 }).toArray();
    res.json(slides);
}

export async function addCarouselController(req, res) {
    try {
        const { tmdbID, imagePath, imageType } = req.body;

        if (!tmdbID || !imagePath) {
            return res.status(400).json({ error: "tmdbID and imagePath required" });
        }

        const db = await getDb();

        // prevent duplicates
        const exists = await db.collection("carousel").findOne({ tmdbID });
        if (exists) {
            return res.status(409).json({ error: "Slide already exists" });
        }

        // 🔥 Fetch from TMDB
        const movie = await fetchMovieFromTMDB(tmdbID);

        const slide = {
            tmdbID,
            title: movie.title,
            overview: movie.overview,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            genres: movie.genres.map(g => g.name),
            imagePath,                 // carousel image
            imageType: imageType || "tmdb",
            pinned: false,
            isActive: true,
            order: 0,
            createdAt: new Date(),
        };

        await db.collection("carousel").insertOne(slide);

        res.json({ message: "Carousel slide added", slide });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}


export async function deleteCarouselController(req, res) {
    const { tmdbID } = req.body;
    if (!tmdbID) return res.status(400).json({ error: "TMDB ID required" });

    const db = await getDb();
    const slide = await db.collection("carousel").findOne({ tmdbID: Number(tmdbID) });
    if (!slide) return res.status(404).json({ error: "Slide not found" });

    await db.collection("carousel").deleteOne({ tmdbID: Number(tmdbID) });
    res.json({ message: "Slide deleted", slide });
}
