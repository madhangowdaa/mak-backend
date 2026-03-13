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
        // fileLink: m.fileLink,
        pinned: m.pinned || false,
        clicks: m.clicks || 0,
        trending: m.trending || { isTrending: false, trendingOrder: null }
    }));
}

/* ================= ADD / UPDATE TRENDING ================= */
export async function setTrendingMovieService(tmdbID, trendingOrder = null) {
    const db = await getDb();
    const movies = db.collection("movies");

    const movie = await movies.findOne({ tmdbID });
    if (!movie) throw new Error("Movie not found");

    const trendingData = {
        isTrending: true,
        trendingOrder: trendingOrder !== null ? trendingOrder : movie.trending?.trendingOrder || 999
    };

    await movies.updateOne(
        { tmdbID },
        { $set: { trending: trendingData, updatedAt: new Date() } }
    );

    return { ...movie, trending: trendingData };
}

/* ================= REMOVE FROM TRENDING + REORDER ================= */
export async function removeTrendingMovieService(tmdbID) {
    const db = await getDb();
    const movies = db.collection("movies");

    const movie = await movies.findOne({ tmdbID });
    if (!movie) throw new Error("Movie not found");

    // 1️⃣ Remove trending flag
    const trendingData = {
        isTrending: false,
        trendingOrder: null
    };

    await movies.updateOne(
        { tmdbID },
        {
            $set: { trending: trendingData, updatedAt: new Date() }
        }
    );

    // 2️⃣ Reorder remaining trending movies
    const trendingMovies = await movies
        .find({ "trending.isTrending": true })
        .sort({ "trending.trendingOrder": 1 })
        .toArray();

    for (let i = 0; i < trendingMovies.length; i++) {
        const tm = trendingMovies[i];
        // Assign sequential order: 1, 2, 3...
        await movies.updateOne(
            { tmdbID: tm.tmdbID },
            { $set: { "trending.trendingOrder": i + 1 } }
        );
    }

    return { ...movie, trending: trendingData };
}
