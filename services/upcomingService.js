import { getDb } from "../db.js";
import axios from "axios";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_BASE = "https://api.themoviedb.org/3/movie";

async function fetchTMDBMovie(tmdbID) {
    const res = await axios.get(`${TMDB_API_BASE}/${tmdbID}`, {
        params: { api_key: TMDB_API_KEY }
    });
    const data = res.data;
    return {
        title: data.title,
        overview: data.overview,
        poster_path: data.poster_path,
        genres: data.genres?.map(g => g.name) || [],
        language: data.original_language
    };
}

// Add / update upcoming
export async function setUpcomingMovieService({ tmdbID, ott_release = null, upcomingOrder = 999 }) {
    const db = await getDb();
    const upcomingCol = db.collection("upcoming");

    // Fetch TMDB info
    const tmdbData = await fetchTMDBMovie(tmdbID);
    if (!tmdbData) throw new Error("Failed to fetch movie details from TMDB");

    const doc = {
        tmdbID: Number(tmdbID),
        upcoming: {
            isUpcoming: true,
            upcomingOrder,
            ott_release: ott_release ? new Date(ott_release) : null
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...tmdbData
    };

    await upcomingCol.updateOne(
        { tmdbID: Number(tmdbID) },
        { $set: doc, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
    );

    return doc;
}

// Remove upcoming
export async function removeUpcomingMovieService(tmdbID) {
    const db = await getDb();
    const upcomingCol = db.collection("upcoming");

    const update = {
        "upcoming.isUpcoming": false,
        "upcoming.upcomingOrder": null,
        "upcoming.ott_release": null,
        updatedAt: new Date()
    };

    await upcomingCol.updateOne({ tmdbID: Number(tmdbID) }, { $set: update });

    return { tmdbID };
}

// Get upcoming movies
export async function getUpcomingMoviesService(limit = 10) {
    const db = await getDb();
    const upcomingCol = db.collection("upcoming");

    return await upcomingCol
        .find({ "upcoming.isUpcoming": true })
        .sort({ "upcoming.upcomingOrder": 1, "upcoming.ott_release": 1, updatedAt: -1 })
        .limit(limit)
        .toArray();
}
