// services\upcomingService.js
import { getDb } from "../db.js";

/* ================= GET UPCOMING MOVIES ================= */
export async function getUpcomingMoviesService(limit = 10) {
    const db = await getDb();
    const movies = db.collection("movies");

    const results = await movies
        .find({ "upcoming.isUpcoming": true })
        .sort({
            "upcoming.upcomingOrder": 1, // manual order first
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
        fileLink: m.fileLink,
        pinned: m.pinned || false,
        clicks: m.clicks || 0,
        trending: m.trending || { isTrending: false, trendingOrder: null },
        upcoming: m.upcoming || { isUpcoming: false, upcomingOrder: null }
    }));
}

/* ================= ADD / UPDATE UPCOMING ================= */
export async function setUpcomingMovieService(tmdbID, trendingOrder = null) {
    const db = await getDb();
    const movies = db.collection("movies");

    const movie = await movies.findOne({ tmdbID });
    if (!movie) throw new Error("Movie not found");

    const upcomingData = {
        isUpcoming: true,
        upcomingOrder: upcomingOrder !== null ? upcomingOrder : movie.upcoming?.upcomingOrder || 999
    };

    await movies.updateOne(
        { tmdbID },
        { $set: { upcoming: upcomingData, updatedAt: new Date() } }
    );

    // Return full movie info
    return { ...movie, upcoming: upcomingData };
}


/* ================= REMOVE FROM UPCOMING ================= */
export async function removeUpcomingMovieService(tmdbID) {
    const db = await getDb();
    const movies = db.collection("movies");

    const movie = await movies.findOne({ tmdbID });
    if (!movie) throw new Error("Movie not found");

    await movies.updateOne(
        { tmdbID },
        { $set: { upcoming: { isUpcoming: false, upcomingOrder: null }, updatedAt: new Date() } }
    );
    // Return full movie info
    return { ...movie, upcoming: upcomingData };
}
