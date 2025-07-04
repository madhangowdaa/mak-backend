import fetch from 'node-fetch';
import { getDb } from '../db.js';

export async function addMovieService(tmdbID, fileLink) {
	const tmdbRes = await fetch(
		`https://api.themoviedb.org/3/movie/${tmdbID}?api_key=${process.env.TMDB_API_KEY}`
	);
	if (!tmdbRes.ok) throw new Error('Failed to fetch TMDb data');

	const data = await tmdbRes.json();

	const movie = {
		tmdbID,
		title: data.title,
		overview: data.overview,
		poster_path: data.poster_path,
		release_date: data.release_date,
		genres: data.genres?.map((g) => g.name) || [],
		fileLink,
	};

	const db = await getDb();
	const collection = db.collection('movies');

	const existing = await collection.findOne({ tmdbID });
	if (existing) throw new Error('Movie already exists');

	await collection.insertOne(movie);
	return movie;
}

export async function getAllMoviesService() {
	const db = await getDb();
	const collection = db.collection('movies');
	return collection.find({}).toArray();
}
