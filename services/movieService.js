// services/movieService.js
import fetch from "node-fetch";
import { getDb } from "../db.js";

const TMDB_API = process.env.TMDB_API_KEY;

// ---------------- Helper: Fetch TMDB Details ----------------
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

// ---------------- Add Movie ----------------
export async function addMovieService(tmdbID, fileLink, options = {}) {
	const db = await getDb();
	const movies = db.collection("movies");

	const existing = await movies.findOne({ tmdbID });
	if (existing) throw new Error("Movie already exists");

	const data = await fetchTMDB(tmdbID);

	const { position = "l", pinned = false } = options;

	// Determine order
	let order = Date.now();
	if (position === "f") {
		const first = await movies.find().sort({ order: 1 }).limit(1).toArray();
		order = first.length ? first[0].order - 1 : order;
	} else if (position === "l") {
		const last = await movies.find().sort({ order: -1 }).limit(1).toArray();
		order = last.length ? last[0].order + 1 : order;
	}

	const movie = {
		...data,
		tmdbID,
		fileLink,
		pinned,
		order,
		createdAt: new Date(),
	};

	await movies.insertOne(movie);
	return movie;
}

// ---------------- Update Movie ----------------
export async function updateMovieService(tmdbID, fileLink, options = {}) {
	const db = await getDb();
	const movies = db.collection("movies");

	const existing = await movies.findOne({ tmdbID });
	if (!existing) throw new Error("Movie not found");

	const data = await fetchTMDB(tmdbID);

	let order = existing.order;
	if (options.position) {
		if (options.position === "f") {
			const first = await movies.find().sort({ order: 1 }).limit(1).toArray();
			order = first.length ? first[0].order - 1 : order;
		} else if (options.position === "l") {
			const last = await movies.find().sort({ order: -1 }).limit(1).toArray();
			order = last.length ? last[0].order + 1 : order;
		}
	}

	const updated = {
		...data,
		tmdbID,
		fileLink,
		pinned: options.pinned ?? existing.pinned,
		order,
		updatedAt: new Date(),
	};

	await movies.updateOne({ tmdbID }, { $set: updated });
	return updated;
}

// ---------------- Delete Movie ----------------
export async function deleteMovieService(tmdbID) {
	const db = await getDb();
	const movies = db.collection("movies");

	const movie = await movies.findOne({ tmdbID });
	if (!movie) throw new Error("Movie not found");

	await movies.deleteOne({ tmdbID });
	return movie;
}

// ---------------- Get Movies with Pagination + Search + Sort ----------------
export async function getMoviesService({
	page = 1,
	limit = 20,
	q = "",
	sort = "latest",
}) {
	const db = await getDb();
	const movies = db.collection("movies");

	// Build search filter
	const query = q ? { title: { $regex: q, $options: "i" } } : {};

	// Count total for pagination
	const totalMovies = await movies.countDocuments(query);

	// Sorting
	let sortOption = {};
	if (sort === "latest") sortOption = { order: -1, createdAt: -1 };
	else if (sort === "oldest") sortOption = { order: 1, createdAt: 1 };
	else if (sort === "pinned") sortOption = { pinned: -1, order: -1, createdAt: -1 };

	// Fetch paginated results
	const results = await movies
		.find(query)
		.sort(sortOption)
		.skip((page - 1) * limit)
		.limit(limit)
		.toArray();

	// Map MongoDB docs to include `id` for frontend routing
	const mappedResults = results.map((movie) => ({
		id: movie.tmdbID, // frontend uses `movie.id` for routing
		tmdbID: movie.tmdbID,
		title: movie.title,
		overview: movie.overview,
		poster_path: movie.poster_path,
		release_date: movie.release_date,
		genres: movie.genres || [],
		fileLink: movie.fileLink,
		pinned: movie.pinned || false,
		order: movie.order || 0,
		createdAt: movie.createdAt || null,
	}));

	const totalPages = Math.ceil(totalMovies / limit);

	return { results: mappedResults, totalPages, currentPage: page };
}
