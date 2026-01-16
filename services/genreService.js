// services\genreService.js
import { getDb } from "../db.js";

/* ================= GENRE PREVIEW ================= */

export async function getGenrePreviewService(genre, limit = 10) {
    const db = await getDb();
    const movies = db.collection("movies");

    const results = await movies
        .find({
            genres: { $regex: new RegExp(`^${genre}$`, "i") },
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

    return results.map(m => ({
        id: m.tmdbID,
        tmdbID: m.tmdbID,
        title: m.title,
        poster_path: m.poster_path,
        genres: m.genres || [],
        fileLink: m.fileLink,
    }));
}

/* ================= MOVIES BY GENRE ================= */

export async function getMoviesByGenreService({
    genre,
    page = 1,
    limit = 20,
    sort = "latest",
}) {
    const db = await getDb();
    const movies = db.collection("movies");

    const query = {
        genres: { $regex: new RegExp(`^${genre}$`, "i") },
    };

    const totalMovies = await movies.countDocuments(query);

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "pinned") sortOption = { pinned: -1, order: 1 };

    const results = await movies
        .find(query)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

    return {
        results: results.map(m => ({
            id: m.tmdbID,
            tmdbID: m.tmdbID,
            title: m.title,
            overview: m.overview,
            poster_path: m.poster_path,
            release_date: m.release_date,
            genres: m.genres || [],
            fileLink: m.fileLink,
            pinned: m.pinned || false,
            clicks: m.clicks || 0,
            trending: m.trending || {},
        })),
        totalPages: Math.ceil(totalMovies / limit),
        currentPage: page,
    };
}


export async function getGenresWithCountService() {
    const db = await getDb();
    const movies = db.collection("movies");

    // Aggregate genres and counts
    const results = await movies.aggregate([
        { $unwind: "$genres" },            // flatten genres array
        { $group: { _id: "$genres", count: { $sum: 1 } } }, // count per genre
        { $sort: { _id: 1 } },             // sort alphabetically
    ]).toArray();

    // Map to frontend-friendly format
    return results.map(r => ({
        name: r._id,
        count: r.count
    }));
}
