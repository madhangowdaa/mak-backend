// services\statsService.js
import { getDb } from "../db.js";

export async function getFooterStatsService() {
    const db = await getDb();

    const moviesCollection = db.collection("movies");
    const seriesCollection = db.collection("series");

    // Count documents
    const [totalMovies, totalSeries] = await Promise.all([
        moviesCollection.countDocuments(),
        seriesCollection.countDocuments()
    ]);

    return {
        totalMovies,
        totalSeries,
        totalTitles: totalMovies + totalSeries
    };
}
