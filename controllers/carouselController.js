// controllers/carouselController.js
import { getDb } from "../db.js";
import { fetchMovieFromTMDB } from "../utils/tmdb.js";

export async function getCarouselController(req, res) {
    const db = await getDb();

    const slides = await db.collection("carousel")
        .find({ isActive: true })
        .sort({ pinned: -1, order: 1 })
        .toArray();

    res.json(slides);
}

export async function addCarouselController(req, res) {
    try {
        const { tmdbID, imagePath, imageType, orderPos } = req.body;

        if (!tmdbID || !imagePath) {
            return res.status(400).json({ error: "tmdbID and imagePath required" });
        }

        const db = await getDb();

        const exists = await db.collection("carousel").findOne({ tmdbID });
        if (exists) {
            return res.status(409).json({ error: "Slide already exists" });
        }

        // 🔥 Fetch from TMDB
        const movie = await fetchMovieFromTMDB(tmdbID);

        let order = 0;

        if (orderPos === "l") {
            // insert at LAST
            const last = await db
                .collection("carousel")
                .find({})
                .sort({ order: -1 })
                .limit(1)
                .toArray();

            order = last.length ? last[0].order + 1 : 0;

        } else {
            // insert at FIRST (default)
            await db.collection("carousel").updateMany(
                {},
                { $inc: { order: 1 } }
            );
            order = 0;
        }

        const slide = {
            tmdbID,
            title: movie.title,
            overview: movie.overview,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            genres: movie.genres.map(g => g.name),
            imagePath,
            imageType: imageType || "tmdb",
            pinned: false,
            isActive: true,
            order,
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

export async function moveCarouselController(req, res) {
    const { tmdbID, position } = req.body;

    if (!tmdbID || position === undefined) {
        return res.status(400).json({ error: "tmdbID and position required" });
    }

    const db = await getDb();

    const slide = await db.collection("carousel").findOne({ tmdbID });
    if (!slide) return res.status(404).json({ error: "Slide not found" });

    const slides = await db.collection("carousel")
        .find({})
        .sort({ order: 1 })
        .toArray();

    const maxPos = slides.length - 1;
    const newPos = Math.max(0, Math.min(position, maxPos));

    slides.splice(slide.order, 1);
    slides.splice(newPos, 0, slide);

    for (let i = 0; i < slides.length; i++) {
        await db.collection("carousel").updateOne(
            { tmdbID: slides[i].tmdbID },
            { $set: { order: i } }
        );
    }

    res.json({ message: "Slide moved", position: newPos });
}

export async function pinCarouselController(req, res) {
    const { tmdbID } = req.body;
    const db = await getDb();

    await db.collection("carousel").updateOne(
        { tmdbID },
        { $set: { pinned: true } }
    );

    res.json({ message: "Slide pinned" });
}

export async function unpinCarouselController(req, res) {
    const { tmdbID } = req.body;
    const db = await getDb();

    await db.collection("carousel").updateOne(
        { tmdbID },
        { $set: { pinned: false } }
    );

    res.json({ message: "Slide unpinned" });
}
