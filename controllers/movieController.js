// controllers/movieController.js
import {
	addMovieService,
	updateMovieService,
	deleteMovieService,
	getMoviesService,
	getRecentMoviesService,
	incrementMovieClicksService,
	getTopKannadaMoviesService,
	getMovieDownloadLinkService,
	getMovieUltraLinkService,
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

//Top 10 movies based on views 
export async function getTopKannadaMoviesController(req, res) {
	try {
		const { limit = 10 } = req.query;

		const movies = await getTopKannadaMoviesService(Number(limit));

		res.json({
			results: movies,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to fetch top Kannada movies" });
	}
}

export async function getMovieDownloadController(req, res) {
	try {
		const tmdbID = Number(req.params.tmdbID);
		if (!tmdbID) return res.status(400).json({ error: "TMDb ID required" });

		// Basic anti-bot check
		const userAgent = req.headers["user-agent"];
		if (!userAgent || userAgent.includes("bot")) {
			return res.status(403).json({ error: "Bots not allowed" });
		}

		const link = await getMovieDownloadLinkService(tmdbID);

		res.json({ link });
	} catch (error) {
		console.error("Download Error:", error);
		res.status(500).json({ error: error.message });
	}
}

export async function getMovieUltraDownloadController(req, res) {
	try {
		const tmdbID = Number(req.params.tmdbID);
		if (!tmdbID) return res.status(400).json({ error: "TMDb ID required" });

		const ultra = await getMovieUltraLinkService(tmdbID);

		if (!ultra) {
			return res.status(404).json({ error: "Ultra version not available" });
		}

		res.json(ultra);

	} catch (error) {
		console.error("Ultra Download Error:", error);
		res.status(500).json({ error: error.message });
	}
}
