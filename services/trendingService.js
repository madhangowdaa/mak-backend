// services/trendingService.js
import { getDb } from "../db.js";

/* ================= GET TRENDING MOVIES ================= */
export async function getTrendingMoviesService(limit = 10) {
    const db = await getDb();
    const movies = db.collection("movies");

    const results = await movies
        .find({ "trending.isTrending": true })
        .sort({
            "trending.trendingOrder": 1, // manual order first
            clicks: -1,                   // then popularity
            updatedAt: -1                 // then most recent
        })
        .limit(limit)
        .toArray();

    return results.map(m => ({
        id: m.tmdbID,
        tmdbID: m.tmdbID,
        title: m.title,
        overview: m.overview,
        poster_path: m.poster_path,
        release_date: m.release_date,
        genres: m.genres || [],
        pinned: m.pinned || false,
        clicks: m.clicks || 0,
        trending: m.trending || { isTrending: false, trendingOrder: null }
    }));
}

/* ================= ADD / UPDATE TRENDING ================= */
export async function setTrendingMovieService(tmdbID, trendingOrderOrPosition) {
    const db = await getDb();
    const movies = db.collection("movies");

    tmdbID = Number(tmdbID);

    // Accept either the old 'trendingOrder' key or 'newPosition'
    const newPosition = Number(trendingOrderOrPosition);

    if (isNaN(tmdbID) || isNaN(newPosition)) {
        throw new Error("Invalid tmdbID or position");
    }

    const movie = await movies.findOne({ tmdbID });
    if (!movie) throw new Error("Movie not found");

    // 1️⃣ Get all trending movies
    const trendingMovies = await movies
        .find({ "trending.isTrending": true })
        .sort({ "trending.trendingOrder": 1 })
        .toArray();

    // 2️⃣ Remove current movie if exists
    const filtered = trendingMovies.filter(m => m.tmdbID !== tmdbID);

    // 3️⃣ Clamp position: user expects 1-based indexing
    const maxPos = filtered.length;
    const pos = Math.max(0, Math.min(newPosition - 1, maxPos));

    // 4️⃣ Insert at new position
    filtered.splice(pos, 0, movie);

    // 5️⃣ Update all trending orders sequentially starting at 1
    for (let i = 0; i < filtered.length; i++) {
        await movies.updateOne(
            { tmdbID: filtered[i].tmdbID },
            {
                $set: {
                    "trending.isTrending": true,
                    "trending.trendingOrder": i + 1,
                    updatedAt: new Date()
                }
            }
        );
    }

    return { ...movie, trending: { isTrending: true, trendingOrder: pos + 1 } };
}

/* ================= REMOVE FROM TRENDING + REORDER ================= */
export async function removeTrendingMovieService(tmdbID) {
    const db = await getDb();
    const movies = db.collection("movies");

    tmdbID = Number(tmdbID);
    if (isNaN(tmdbID)) throw new Error("Invalid tmdbID");

    const movie = await movies.findOne({ tmdbID });
    if (!movie) throw new Error("Movie not found");

    // 1️⃣ Remove trending flag
    const trendingData = { isTrending: false, trendingOrder: null };
    await movies.updateOne(
        { tmdbID },
        { $set: { trending: trendingData, updatedAt: new Date() } }
    );

    // 2️⃣ Reorder remaining trending movies
    const trendingMovies = await movies
        .find({ "trending.isTrending": true })
        .sort({ "trending.trendingOrder": 1 })
        .toArray();

    for (let i = 0; i < trendingMovies.length; i++) {
        await movies.updateOne(
            { tmdbID: trendingMovies[i].tmdbID },
            { $set: { "trending.trendingOrder": i + 1 } }
        );
    }

    // 3️⃣ Return updated movie info
    return { ...movie, trending: trendingData };
}
