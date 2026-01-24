// services\searchService.js
import { getDb } from '../db.js';

export async function globalSearchService(q, limit = 10) {
	const db = await getDb();

	const moviesCol = db.collection('movies');
	const seriesCol = db.collection('series');
	const hdtvCol = db.collection('hdtv');

	if (!q || !q.trim()) {
		return { movies: [], series: [], hdtvRips: [] };
	}

	const regex = { $regex: q, $options: 'i' };

	const [movies, series, hdtvRips] = await Promise.all([
		moviesCol.find({ title: regex }).limit(limit).toArray(),

		seriesCol.find({ title: regex }).limit(limit).toArray(),

		hdtvCol.find({ title: regex }).limit(limit).toArray(),
	]);

	return {
		movies: movies.map((m) => ({
			id: m.tmdbID,
			tmdbID: m.tmdbID,
			title: m.title,
			poster_path: m.poster_path,
			release_date: m.release_date,
			clicks: m.clicks || 0,
			trending: m.trending || {},
		})),

		series: series.map((s) => ({
			id: s.tmdbID,
			tmdbID: s.tmdbID,
			title: s.title,
			poster_path: s.poster_path,
			first_air_date: s.first_air_date,
		})),

		hdtvRips: hdtvRips.map((m) => ({
			id: m.tmdbID,
			tmdbID: m.tmdbID,
			title: m.title,
			poster_path: m.poster_path,
			release_date: m.release_date,
			clicks: m.clicks || 0,
			trending: m.trending || {},
		})),
	};
}
