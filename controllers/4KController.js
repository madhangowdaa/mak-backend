// controllers\4KController.js
import { setMovieUltraLinkService, getMovieUltraLinkService } from "../services/movieService.js";
import { getDb } from "../db.js";

/**
 * Add/Update/Delete ultraLink via admin/bot
 */
// controllers/4KController.js
export async function putUltraLinkController(req, res) {
    try {
        const { tmdbID, ultraLink, secret } = req.body;

        if (secret !== process.env.ADMIN_SECRET) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        if (!tmdbID) return res.status(400).json({ error: "tmdbID required" });

        const db = await getDb();
        const movies = db.collection("movies");

        // Update the ultraLink (or null if deleting)
        await movies.updateOne(
            { tmdbID },
            { $set: { ultraLink: ultraLink || null } }
        );

        // Return the full movie object after update
        const movie = await movies.findOne({ tmdbID });

        const msg = ultraLink === null
            ? "Ultra link deleted successfully"
            : "Ultra link added/updated successfully";

        res.json({ message: msg, movie });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
// export async function putUltraLinkController(req, res) {
//     try {
//         const { tmdbID, ultraLink, secret } = req.body;

//         // simple admin auth
//         if (secret !== process.env.ADMIN_SECRET) {
//             return res.status(403).json({ error: "Unauthorized" });
//         }

//         if (!tmdbID) return res.status(400).json({ error: "tmdbID required" });

//         const updatedUltra = await setMovieUltraLinkService(tmdbID, ultraLink || null);

//         const msg = ultraLink === null
//             ? "Ultra link deleted successfully"
//             : "Ultra link added/updated successfully";

//         res.json({ message: msg, ultraLink: updatedUltra });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: err.message });
//     }
// }

/**
 * Get ultraLink for a movie (optional endpoint for frontend)
 */
export async function getMovieUltraDownloadController(req, res) {
    try {
        const tmdbID = Number(req.params.tmdbID);
        if (!tmdbID) return res.status(400).json({ error: "TMDb ID required" });

        const ultra = await getMovieUltraLinkService(tmdbID);

        if (!ultra) return res.status(404).json({ error: "Ultra version not available" });

        res.json(ultra);
    } catch (error) {
        console.error("Ultra Download Error:", error);
        res.status(500).json({ error: error.message });
    }
}
