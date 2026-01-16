// routes\genres.js
import express from "express";
import {
    getGenrePreviewController,
    getMoviesByGenreController,
    getGenresWithCountController
} from "../controllers/genreController.js";

const router = express.Router();

router.get("/movies/genre",getGenresWithCountController);
router.get("/movies/genre/:genre/preview", getGenrePreviewController);
router.get("/movies/genre/:genre", getMoviesByGenreController);

export default router;
