// services/movieService.js
import fetch from "node-fetch";
import { getDb } from "../db.js";

const TMDB_API = process.env.TMDB_API_KEY;

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

/* ================= ADD MOVIE ================= */

export async function addMovieService(tmdbID, fileLink, options = {}) {
	const db = await getDb();
	const movies = db.collection("movies");

	if (await movies.findOne({ tmdbID })) {
		throw new Error("Movie already exists");
	}

	const data = await fetchTMDB(tmdbID);

	const position = options.position || "l"; // f | l
	const pinned = Boolean(options.pinned);

	let order = 0;

	if (position === "f") {
		// Insert BEFORE first movie
		const first = await movies.find().sort({ order: 1 }).limit(1).toArray();
		order = first.length ? first[0].order - 1 : 0;
	} else {
		// Insert AFTER last movie (DEFAULT)
		const last = await movies.find().sort({ order: -1 }).limit(1).toArray();
		order = last.length ? last[0].order + 1 : 0;
	}

	const trending = options.trending || { isTrending: false, trendingOrder: 0 };

	const movie = {
		...data,
		tmdbID,
		fileLink,
		pinned,
		order,
		trending,
		createdAt: new Date(),
	};


	await movies.insertOne(movie);
	return movie;
}

/* ================= UPDATE MOVIE ================= */

export async function updateMovieService(tmdbID, fileLink, options = {}) {
	const db = await getDb();
	const movies = db.collection("movies");

	const existing = await movies.findOne({ tmdbID });
	if (!existing) throw new Error("Movie not found");

	const data = await fetchTMDB(tmdbID);

	let order = existing.order;

	if (options.position === "f") {
		const first = await movies.find().sort({ order: 1 }).limit(1).toArray();
		order = first.length ? first[0].order - 1 : order;
	}

	if (options.position === "l") {
		const last = await movies.find().sort({ order: -1 }).limit(1).toArray();
		order = last.length ? last[0].order + 1 : order;
	}

	const updated = {
		...data,
		tmdbID,
		fileLink,
		pinned:
			typeof options.pinned === "boolean"
				? options.pinned
				: existing.pinned,
		order,
		trending: options.trending || existing.trending || { isTrending: false, trendingOrder: 0 },
		updatedAt: new Date(),
	};


	await movies.updateOne({ tmdbID }, { $set: updated });
	return updated;
}

/* ================= DELETE ================= */

export async function deleteMovieService(tmdbID) {
	const db = await getDb();
	const movies = db.collection("movies");

	const movie = await movies.findOne({ tmdbID });
	if (!movie) throw new Error("Movie not found");

	await movies.deleteOne({ tmdbID });
	return movie;
}

/* ================= GET MOVIES ================= */

export async function getMoviesService({
	page = 1,
	limit = 20,
	q = "",
	sort = "latest",
}) {
	const db = await getDb();
	const movies = db.collection("movies");

	const query = q ? { title: { $regex: q, $options: "i" } } : {};
	const totalMovies = await movies.countDocuments(query);

	let sortOption = { order: 1 };

	if (sort === "latest") sortOption = { order: 1, createdAt: -1 };
	if (sort === "oldest") sortOption = { order: -1, createdAt: 1 };
	if (sort === "pinned") sortOption = { pinned: -1, order: 1 };

	const results = await movies
		.find(query)
		.sort(sortOption)
		.skip((page - 1) * limit)
		.limit(limit)
		.toArray();

	const mapped = results.map((m) => ({
		id: m.tmdbID, // IMPORTANT for frontend routing
		tmdbID: m.tmdbID,
		title: m.title,
		overview: m.overview,
		poster_path: m.poster_path,
		release_date: m.release_date,
		genres: m.genres || [],
		fileLink: m.fileLink,
		pinned: m.pinned || false,
		clicks:m.clicks || 0,
		trending:m.trending ||{},
	}));

	return {
		results: mapped,
		totalPages: Math.ceil(totalMovies / limit),
		currentPage: page,
	};
}

/* ================= RECENT MOVIES ================= */

export async function getRecentMoviesService(limit = 10) {
	const db = await getDb();
	const movies = db.collection("movies");

	const results = await movies
		.find({})
		.sort({ createdAt: -1 }) // 🔥 ONLY by creation time
		.limit(limit)
		.toArray();

	return results.map((m) => ({
		id: m.tmdbID,
		tmdbID: m.tmdbID,
		title: m.title,
		overview: m.overview,
		poster_path: m.poster_path,
		release_date: m.release_date,
		genres: m.genres || [],
		fileLink: m.fileLink,
		pinned: m.pinned || false,
		createdAt: m.createdAt,
		clicks:m.clicks || 0,
		trending: m.trending || {},
	}));
}


/* ================= INCREMENT COUNT ON MOVIES ================= */

export async function incrementMovieClicksService(tmdbID) {
	const db = await getDb();
	const movies = db.collection('movies');

	const movie = await movies.findOne({ tmdbID });
	if (!movie) throw new Error('Movie not found');

	const updated = await movies.findOneAndUpdate(
		{ tmdbID },
		{ $inc: { clicks: 1 } }, // increment clicks by 1
		{ returnDocument: 'after' } // return updated document
	);

	return updated.value; // contains updated clicks
}

/* ================= TOP KANNADA MOVIES ================= */

export async function getTopKannadaMoviesService(limit = 10) {
	const db = await getDb();
	const movies = db.collection("movies");

	// Filter Kannada movies (language code "kn") and sort by order or clicks
	const results = await movies
		.find({ original_language: "kn" }) // make sure your data has this field
		.sort({ clicks: -1, createdAt: -1 }) // top clicked first, then latest
		.limit(limit)
		.toArray();

	return results.map((m) => ({
		id: m.tmdbID,
		tmdbID: m.tmdbID,
		title: m.title,
		overview: m.overview,
		poster_path: m.poster_path,
		release_date: m.release_date,
		genres: m.genres || [],
		fileLink: m.fileLink,
		pinned: m.pinned || false,
		createdAt: m.createdAt,
		clicks: m.clicks || 0,
	}));
}

/* ================= TRENDING MOVIES ================= */

export async function getTrendingMoviesService(limit = 10) {
	const db = await getDb();
	const movies = db.collection("movies");

	const results = await movies
		.find({ "trending.isTrending": true })
		.sort({ "trending.trendingOrder": 1 }) // lower order = higher priority
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
		trending: m.trending || {},
	}));
}
