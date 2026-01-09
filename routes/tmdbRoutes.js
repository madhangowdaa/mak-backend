import express from "express";
import { getPopularMovies } from "../controllers/tmdbController.js";

const router = express.Router();

router.get("/popularmovies", getPopularMovies);

export default router;
