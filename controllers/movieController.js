import {
	addMovieService,
	getAllMoviesService,
	updateMovieService,
	deleteMovieService,
} from '../services/movieService.js';

export async function addMovieController(req, res) {
	try {
		const { tmdbID, fileLink } = req.body;
		const movie = await addMovieService(tmdbID, fileLink);
		res.json({ message: "✅ Movie added successfully", movie });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
}

export async function updateMovieController(req, res) {
	try {
		const { tmdbID, fileLink } = req.body;
		const movie = await updateMovieService(tmdbID, fileLink);
		res.json({ message: "✏️ Movie updated successfully", movie });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
}

export async function deleteMovieController(req, res) {
	try {
		let { tmdbID } = req.body;
		if (!tmdbID) return res.status(400).json({ error: "TMDb ID required" });

		tmdbID = Number(tmdbID); // convert string -> number

		const movie = await deleteMovieService(tmdbID);
		res.json({ message: `🗑️ Deleted movie: ${movie.title}`, movie });
	} catch (error) {
		console.error("Delete Error:", error);
		res.status(500).json({ error: error.message });
	}
}


export async function getAllMoviesController(req, res) {
	try {
		const movies = await getAllMoviesService();
		res.json(movies);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to fetch movies" });
	}
}
