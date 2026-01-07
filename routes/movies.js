import express from 'express';
import {
	addMovieController,
	updateMovieController,
	deleteMovieController,
	getAllMoviesController,
} from '../controllers/movieController.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/movies', getAllMoviesController);
router.post('/addMovie', verifyAdmin, addMovieController);
router.put('/updateMovie', verifyAdmin, updateMovieController);
router.delete('/deleteMovie', verifyAdmin, deleteMovieController);

export default router;
