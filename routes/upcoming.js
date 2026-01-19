// routes\upcoming.js
import express from "express";
import {
    getUpcomingMoviesController,
    setUpcomingMovieController,
    removeUpcomingMovieController
} from '../controllers/upcomingController.js';
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get trending movies
router.get("/movies/upcoming", getUpcomingMoviesController);

// Admin routes
router.post("/movies/upcoming/add", verifyAdmin, setUpcomingMovieController);
router.post("/movies/upcoming/remove", verifyAdmin, removeUpcomingMovieController);

export default router;
