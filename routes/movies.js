//routes/movies.js
import express from 'express';
import {
	addMovieController,
	updateMovieController,
	deleteMovieController,
	getAllMoviesController,
	getRecentMoviesController,
	handleClickController,
	getTopKannadaMoviesController,
} from '../controllers/movieController.js';

import { verifyAdmin } from '../middleware/auth.js'

// Add this **after your other routes**


const router = express.Router();
router.get('/movies/top/kannada', getTopKannadaMoviesController);
router.get('/movies/recent', getRecentMoviesController);
router.get('/movies', getAllMoviesController); // query params: ?page=1&limit=20&q=batman&sort=latest
router.post('/click/:tmdbID', handleClickController);
router.post('/addMovie', verifyAdmin, addMovieController);
router.put('/updateMovie', verifyAdmin, updateMovieController);
router.delete('/deleteMovie', verifyAdmin, deleteMovieController);

export default router;


