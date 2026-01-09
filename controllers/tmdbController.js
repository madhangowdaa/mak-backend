import fetch from "node-fetch";

const TMDB_API = process.env.TMDB_API_KEY;

export async function getPopularMovies(req, res) {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API}`
        );

        if (!response.ok) {
            throw new Error("TMDB fetch failed");
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
