import {
	addMovieService,
	getAllMoviesService,
} from '../services/movieService.js';

export async function addMovieController(req, res) {
	try {
		const { tmdbID, fileLink } = req.body;
		const movie = await addMovieService(tmdbID, fileLink);
		res.status(200).json({ message: '✅ Movie added successfully', movie });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
}

export async function getAllMoviesController(req, res) {
	try {
		const movies = await getAllMoviesService();
		res.status(200).json(movies);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Failed to fetch movies' });
	}
}
