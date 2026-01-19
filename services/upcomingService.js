// services\upcomingService.js
import { getDb } from "../db.js";

/* ================= GET UPCOMING MOVIES ================= */
export async function getUpcomingMoviesService(limit = 10) {
    const db = await getDb();
    const movies = db.collection("movies");

    const results = await movies
        .find({ "upcoming.isUpcoming": true })
        .sort({
            "upcoming.upcomingOrder": 1,
            "upcoming.ott_release": 1,
            updatedAt: -1
        })
        .limit(limit)
        .toArray();

    return results.map(m => ({
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
        upcoming: m.upcoming
    }));
}

/* ================= ADD / UPDATE UPCOMING ================= */
export async function setUpcomingMovieService(
    tmdbID,
    upcomingOrder = 999,
    ott_release = null
) {
    const db = await getDb();
    const movies = db.collection("movies");

    const upcomingData = {
        isUpcoming: true,
        upcomingOrder,
        ott_release: ott_release ? new Date(ott_release) : null
    };

    await movies.updateOne(
        { tmdbID },
        {
            $set: {
                tmdbID,
                upcoming: upcomingData,
                updatedAt: new Date()
            },
            $setOnInsert: {
                createdAt: new Date(),
                clicks: 0,
                pinned: false,
                trending: { isTrending: false, trendingOrder: null }
            }
        },
        { upsert: true } // ✅ movie not required to exist
    );

    return { tmdbID, upcoming: upcomingData };
}

/* ================= REMOVE FROM UPCOMING ================= */
export async function removeUpcomingMovieService(tmdbID) {
    const db = await getDb();
    const movies = db.collection("movies");

    await movies.updateOne(
        { tmdbID },
        {
            $set: {
                upcoming: {
                    isUpcoming: false,
                    upcomingOrder: null,
                    ott_release: null
                },
                updatedAt: new Date()
            }
        }
    );

    return { tmdbID };
}
