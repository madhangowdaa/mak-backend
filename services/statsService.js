// services\statsService.js
import { getDb } from "../db.js";

export async function getFooterStatsService() {
    const db = await getDb();

    const moviesCollection = db.collection("movies");
    const seriesCollection = db.collection("series");
    const hdtvCollection = db.collection("hdtv");

    // Count documents
    const [totalMovies, totalSeries, totalHdtvRips] = await Promise.all([
        moviesCollection.countDocuments(),
        seriesCollection.countDocuments(),
        hdtvCollection.countDocuments()
    ]);

    return {
        totalMovies,
        totalSeries,
        totalHdtvRips,
        totalTitles: totalMovies + totalSeries + totalHdtvRips
    };
}
