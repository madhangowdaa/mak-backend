// controllers/top10Controller.js
import { addTop10Service, updateTop10Service, deleteTop10Service, getTop10Service } from '../services/top10Service.js';

export async function addTop10Controller(req, res) {
    try {
        const { tmdbID, rank, secret } = req.body;
        if (secret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: "Unauthorized" });

        const movie = await addTop10Service(tmdbID, rank);
        res.json({ message: "✅ Movie added to Top 10", movie });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateTop10Controller(req, res) {
    try {
        const { tmdbID, rank, unpin, secret } = req.body;
        if (secret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: "Unauthorized" });

        const movie = await updateTop10Service(tmdbID, rank, unpin);
        res.json({ message: "✏️ Top 10 movie updated", movie });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function deleteTop10Controller(req, res) {
    try {
        const { tmdbID, secret } = req.body;
        if (secret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: "Unauthorized" });

        const movie = await deleteTop10Service(tmdbID);
        res.json({ message: "🗑️ Movie removed from Top 10", movie });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getTop10Controller(req, res) {
    try {
        const movies = await getTop10Service();
        res.json({ results: movies });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
