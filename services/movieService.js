import fetch from 'node-fetch';
import { getDb } from '../db.js';

const TMDB_API = process.env.TMDB_API_KEY;

export async function addMovieService(tmdbID, fileLink) {
	const db = await getDb();
	const movies = db.collection('movies');

	const existing = await movies.findOne({ tmdbID });
	if (existing) throw new Error('Movie already exists');

	const data = await fetchTMDB(tmdbID);
	const movie = { ...data, tmdbID, fileLink };
	await movies.insertOne(movie);
	return movie;
}

export async function updateMovieService(tmdbID, fileLink) {
	const db = await getDb();
	const movies = db.collection('movies');

	const existing = await movies.findOne({ tmdbID });
	if (!existing) throw new Error('Movie not found');

	const data = await fetchTMDB(tmdbID);
	const updated = { ...data, tmdbID, fileLink };
	await movies.updateOne({ tmdbID }, { $set: updated });
	return updated;
}

export async function deleteMovieService(tmdbID) {
	const db = await getDb();
	const movies = db.collection('movies');

	const movie = await movies.findOne({ tmdbID });
	if (!movie) throw new Error('Movie not found');

	await movies.deleteOne({ tmdbID });
	return movie;
}

export async function getAllMoviesService() {
	const db = await getDb();
	const movies = db.collection('movies');
	return movies.find({}).toArray();
}

// Helper: Fetch movie details from TMDB
async function fetchTMDB(tmdbID) {
	const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbID}?api_key=${TMDB_API}`);
	if (!res.ok) throw new Error('Failed to fetch TMDb data');
	const data = await res.json();

	return {
		title: data.title,
		overview: data.overview,
		poster_path: data.poster_path,
		release_date: data.release_date,
		genres: data.genres?.map((g) => g.name) || [],
	};
}
