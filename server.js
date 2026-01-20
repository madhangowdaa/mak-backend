import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import moviesRouter from './routes/movies.js';
import seriesRouter from './routes/series.js';
import tmdbRouter from "./routes/tmdb.js";
import tmdbRoutes from "./routes/tmdbRoutes.js";
import carouselRoutes from "./routes/carouselRoutes.js";
import top10Routes from "./routes/top10.js";
import trendingRoutes from "./routes/trending.js";
import genreRoutes from "./routes/genres.js";
import upcomingRoutes from "./routes/upcoming.js";
import statsRotes from "./routes/stats.js";
import searchRoutes from "./routes/search.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", searchRoutes);
app.use("/api", genreRoutes);
app.use('/api', moviesRouter);
app.use("/api/geners",genreRoutes);
app.use('/api/series', seriesRouter);
app.use("/api/tmdb", tmdbRouter);
app.use("/api/populartmdb", tmdbRoutes);
app.use("/api/carousel", carouselRoutes);
app.use("/uploads", express.static("uploads")); // serve uploaded images
app.use("/api", top10Routes);
app.use('/api', trendingRoutes);
app.use('/api', upcomingRoutes);
app.use('/api',statsRotes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
