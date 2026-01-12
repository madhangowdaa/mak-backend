// controllers/carouselController.js
import { getDb } from "../db.js";

export async function getCarouselController(req, res) {
    const db = await getDb();
    const slides = await db.collection("carousel").find({ isActive: true }).sort({ order: 1 }).toArray();
    res.json(slides);
}

export async function addCarouselController(req, res) {
    const { tmdbID, imagePath, imageType } = req.body;
    if (!imagePath) return res.status(400).json({ error: "Image path required" });

    const db = await getDb();
    const slide = {
        tmdbID: tmdbID || null,
        title: tmdbID ? `TMDB Slide ${tmdbID}` : "External Slide",
        imagePath,
        imageType: imageType || "external",
        order: 0,
        isActive: true,
        createdAt: new Date()
    };

    await db.collection("carousel").insertOne(slide);
    res.json({ message: "Slide added", slide });
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
