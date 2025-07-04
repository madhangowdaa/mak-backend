import express from 'express';
import {
	addMovieController,
	getAllMoviesController,
} from '../controllers/movieController.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/movies', getAllMoviesController);
router.post('/addMovie', verifyAdmin, addMovieController);

export default router;
