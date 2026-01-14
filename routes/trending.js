// routes\trending.js
import express from "express";
import {
    getTrendingMoviesController,
    setTrendingMovieController,
    removeTrendingMovieController
} from '../controllers/trendingControlller.js';
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get trending movies
router.get("/movies/trending", getTrendingMoviesController);

// Admin routes
router.post("/movies/trending/add", verifyAdmin, setTrendingMovieController);
router.post("/movies/trending/remove", verifyAdmin, removeTrendingMovieController);

export default router;
