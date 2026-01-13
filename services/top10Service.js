// services/top10Service.js
import { getDb } from "../db.js";

const TOP_COLLECTION = "top10_movies";

/* ================= TMDB FETCH ================= */

async function fetchTMDB(tmdbID) {
    const res = await fetch(
        `https://api.themoviedb.org/3/movie/${tmdbID}?api_key=${TMDB_API}`
    );
    if (!res.ok) throw new Error("Failed to fetch TMDb data");

    const data = await res.json();
    return {
        title: data.title,
        overview: data.overview,
        poster_path: data.poster_path,
        release_date: data.release_date,
        genres: data.genres?.map((g) => g.name) || [],
    };
}

// Add to Top 10
export async function addTop10Service(tmdbID, rank) {
    const db = await getDb();
    const top10 = db.collection(TOP_COLLECTION);

    // Check if rank is already taken → shift others
    await top10.updateMany(
        { rank: { $gte: rank } },
        { $inc: { rank: 1 } }
    );

    // Get movie data from movies collection
    const movie = await db.collection("movies").findOne({ tmdbID });
    if (!movie) throw new Error("Movie not found in movies collection");

    const topMovie = {
        tmdbID,
        rank,
        createdAt: new Date()
    };

    await top10.insertOne(topMovie);

    return { ...topMovie, ...movie };
}

// Update rank of a Top 10 movie
export async function updateTop10Service(tmdbID, newRank, unpin = false) {
    const db = await getDb();
    const top10 = db.collection(TOP_COLLECTION);

    const movieInTop = await top10.findOne({ tmdbID });
    if (!movieInTop) throw new Error("Movie not in Top 10");

    const oldRank = movieInTop.rank;

    if (newRank !== oldRank) {
        // Shift ranks accordingly
        if (newRank < oldRank) {
            await top10.updateMany(
                { rank: { $gte: newRank, $lt: oldRank } },
                { $inc: { rank: 1 } }
            );
        } else {
            await top10.updateMany(
                { rank: { $gt: oldRank, $lte: newRank } },
                { $inc: { rank: -1 } }
            );
        }
    }

    const updateObj = { rank: newRank };
    if (unpin) updateObj.pinned = false;

    await top10.updateOne({ tmdbID }, { $set: updateObj });

    // Get movie details from movies collection
    const movie = await db.collection("movies").findOne({ tmdbID });
    return { ...movie, rank: newRank };
}

// Delete from Top 10
export async function deleteTop10Service(tmdbID) {
    const db = await getDb();
    const top10 = db.collection(TOP_COLLECTION);

    const movie = await top10.findOne({ tmdbID });
    if (!movie) throw new Error("Movie not in Top 10");

    const deletedRank = movie.rank;

    await top10.deleteOne({ tmdbID });

    // Shift ranks after deletion
    await top10.updateMany(
        { rank: { $gt: deletedRank } },
        { $inc: { rank: -1 } }
    );

    // Fetch movie details
    const fullMovie = await db.collection("movies").findOne({ tmdbID });
    return { ...fullMovie, rank: deletedRank };
}

// Get full Top 10 list
export async function getTop10Service() {
    const db = await getDb();
    const top10 = db.collection(TOP_COLLECTION);

    const topMovies = await top10.find().sort({ rank: 1 }).toArray();
    const tmdbIDs = topMovies.map(m => m.tmdbID);
    const movies = await db.collection("movies").find({ tmdbID: { $in: tmdbIDs } }).toArray();

    // Merge movie info with rank
    return topMovies.map(t => {
        const m = movies.find(mv => mv.tmdbID === t.tmdbID);
        return { ...t, ...m };
    });
}
