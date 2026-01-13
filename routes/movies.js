//routes/movies.js
import express from 'express';
import {
	addMovieController,
	updateMovieController,
	deleteMovieController,
	getAllMoviesController,
	getRecentMoviesController,
} from '../controllers/movieController.js';

import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();
router.get('/movies/recent', getRecentMoviesController);
router.get('/movies', getAllMoviesController); // query params: ?page=1&limit=20&q=batman&sort=latest
router.post('/addMovie', verifyAdmin, addMovieController);
router.put('/updateMovie', verifyAdmin, updateMovieController);
router.delete('/deleteMovie', verifyAdmin, deleteMovieController);

export default router;
