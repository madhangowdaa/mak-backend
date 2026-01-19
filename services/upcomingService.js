// services\upcomingService.js
import fetch from "node-fetch";
import { getDb } from "../db.js";

const TMDB_API = process.env.TMDB_API_KEY;
const TMDB_API_BASE = "https://api.themoviedb.org/3/movie";

/* ================= Helper: Fetch TMDB info ================= */
async function fetchTMDBMovie(tmdbID) {
    const res = await fetch(`${TMDB_API_BASE}/${tmdbID}?api_key=${TMDB_API}`);
    if (!res.ok) throw new Error("Failed to fetch movie details from TMDB");

    const data = await res.json();

    return {
        title: data.title,
        overview: data.overview,
        poster_path: data.poster_path,
        genres: data.genres?.map((g) => g.name) || [],
        language: data.original_language
    };
}

/* ================= ADD / UPDATE UPCOMING ================= */
export async function setUpcomingMovieService({ tmdbID, upcomingOrder = 999, ott_release = null }) {
    const db = await getDb();
    const upcomingCol = db.collection("upcoming");

    // Fetch TMDB info
    const tmdbData = await fetchTMDBMovie(tmdbID);
    if (!tmdbData) throw new Error("Failed to fetch movie details from TMDB");

    // Build upcoming object
    const upcomingObj = {
        isUpcoming: true,
        upcomingOrder,
        ott_release: ott_release ? new Date(ott_release) : null
    };

    // Check if movie already exists
    const existing = await upcomingCol.findOne({ tmdbID: Number(tmdbID) });

    if (existing) {
        // Update existing document
        const updatedDoc = {
            ...tmdbData,
            upcoming: upcomingObj,
            isActive: true,
            updatedAt: new Date()
        };

        await upcomingCol.updateOne({ tmdbID: Number(tmdbID) }, { $set: updatedDoc });
        return { ...existing, ...updatedDoc };
    } else {
        // Insert new document
        const newDoc = {
            tmdbID: Number(tmdbID),
            ...tmdbData,
            upcoming: upcomingObj,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await upcomingCol.insertOne(newDoc);
        return newDoc;
    }
}

/* ================= REMOVE UPCOMING ================= */
export async function removeUpcomingMovieService(tmdbID) {
    const db = await getDb();
    const upcomingCol = db.collection("upcoming");

    const movie = await upcomingCol.findOne({ tmdbID: Number(tmdbID) });
    if (!movie) throw new Error("Movie not found");

    await upcomingCol.updateOne(
        { tmdbID: Number(tmdbID) },
        {
            $set: {
                "upcoming.isUpcoming": false,
                "upcoming.upcomingOrder": null,
                "upcoming.ott_release": null,
                isActive: false,
                updatedAt: new Date()
            }
        }
    );

    return { ...movie, upcoming: { isUpcoming: false, upcomingOrder: null, ott_release: null } };
}

/* ================= GET UPCOMING MOVIES ================= */
export async function getUpcomingMoviesService(limit = 10) {
    const db = await getDb();
    const upcomingCol = db.collection("upcoming");

    const results = await upcomingCol
        .find({ "upcoming.isUpcoming": true })
        .sort({ "upcoming.upcomingOrder": 1, "upcoming.ott_release": 1, updatedAt: -1 })
        .limit(limit)
        .toArray();

    return results;
}
