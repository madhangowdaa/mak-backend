// controllers/movieController.js
import {
	addMovieService,
	updateMovieService,
	deleteMovieService,
	getMoviesService,
	getRecentMoviesService,
	incrementMovieClicksService,
} from '../services/movieService.js';


export async function addMovieController(req, res) {
	try {
		const { tmdbID, fileLink, position, pinned } = req.body;
		const movie = await addMovieService(tmdbID, fileLink, { position, pinned });
		res.json({ message: '✅ Movie added successfully', movie });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
}

export async function updateMovieController(req, res) {
	try {
		const { tmdbID, fileLink, position, pinned } = req.body;
		const movie = await updateMovieService(tmdbID, fileLink, { position, pinned });
		res.json({ message: '✏️ Movie updated successfully', movie });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
}

export async function deleteMovieController(req, res) {
	try {
		let { tmdbID } = req.body;
		if (!tmdbID) return res.status(400).json({ error: 'TMDb ID required' });
		tmdbID = Number(tmdbID);

		const movie = await deleteMovieService(tmdbID);
		res.json({ message: `🗑️ Deleted movie: ${movie.title}`, movie });
	} catch (error) {
		console.error('Delete Error:', error);
		res.status(500).json({ error: error.message });
	}
}

// controllers/movieController.js

export async function getAllMoviesController(req, res) {
	try {
		const { page = 1, limit = 20, q = "", sort = "latest" } = req.query;

		const moviesData = await getMoviesService({
			page: Number(page),
			limit: Number(limit),
			q,
			sort,
		});

		res.json(moviesData); // { results: [...], totalPages: X }
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to fetch movies" });
	}
}

export async function getRecentMoviesController(req, res) {
	try {
		const { limit = 10 } = req.query;

		const movies = await getRecentMoviesService(Number(limit));

		res.json({
			results: movies,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to fetch recent movies" });
	}
}

export async function handleClickController(req, res) {
	try {
		const tmdbID = Number(req.params.tmdbID);
		if (!tmdbID) return res.status(400).json({ error: 'TMDb ID required' });

		const updatedMovie = await incrementMovieClicksService(tmdbID);

		res.json({ clicks: updatedMovie.clicks });
	} catch (error) {
		console.error('Click Error:', error);
		res.status(500).json({ error: error.message });
	}
}


