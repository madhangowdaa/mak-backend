import fetch from "node-fetch";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

export async function fetchMovieFromTMDB(tmdbID) {
    const res = await fetch(
        `${TMDB_BASE}/movie/${tmdbID}?api_key=${TMDB_API_KEY}&language=en-US`
    );

    if (!res.ok) {
        throw new Error("TMDB fetch failed");
    }

    return res.json();
}
