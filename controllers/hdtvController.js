import {
    addHDTVService,
    updateHDTVService,
    deleteHDTVService,
    getHDTVService,
    incrementHDTVClicksService
} from "../services/hdtvService.js";

export async function addHDTVController(req, res) {
    try {
        const show = await addHDTVService(req.body);
        res.status(201).json({ message: "HDTV added", show });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export async function updateHDTVController(req, res) {
    try {
        const show = await updateHDTVService(req.params.id, req.body);
        res.json({ message: "HDTV updated", show });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export async function deleteHDTVController(req, res) {
    try {
        const show = await deleteHDTVService(req.params.id);
        res.json({ message: "HDTV deleted", show });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
}

export async function getAllHDTVController(req, res) {
    const data = await getHDTVService(req.query);
    res.json(data);
}

export async function handleHDTVClickController(req, res) {
    const show = await incrementHDTVClicksService(req.params.id);
    res.json({ clicks: show.clicks });
}

// // controllers\hdtvController.js
// import {
//     addHDTVService,
//     updateHDTVService,
//     deleteHDTVService,
//     getHDTVService,
//     incrementHDTVClicksService
// } from "../services/hdtvService.js";

// export async function addHDTVController(req, res) {
//     try {
//         const { tmdbID, fileLink, position, pinned, customData } = req.body;
//         const show = await addHDTVService(tmdbID, fileLink, { position, pinned }, customData);
//         res.json({ message: "✅ HDTV added successfully", show });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: err.message });
//     }
// }

// export async function updateHDTVController(req, res) {
//     try {
//         const { tmdbID, fileLink, position, pinned, customData } = req.body;
//         const show = await updateHDTVService(tmdbID, fileLink, { position, pinned }, customData);
//         res.json({ message: "✏️ HDTV updated successfully", show });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: err.message });
//     }
// }

// export async function deleteHDTVController(req, res) {
//     try {
//         const { tmdbID } = req.body;
//         const show = await deleteHDTVService(tmdbID);
//         res.json({ message: `🗑️ Deleted HDTV: ${show.title}`, show });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: err.message });
//     }
// }

// export async function getAllHDTVController(req, res) {
//     try {
//         const { page = 1, limit = 20, q = "", sort = "latest" } = req.query;
//         const data = await getHDTVService({ page: Number(page), limit: Number(limit), q, sort });
//         res.json(data);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Failed to fetch HDTV shows" });
//     }
// }

// export async function handleHDTVClickController(req, res) {
//     try {
//         const { tmdbID } = req.params;
//         const updated = await incrementHDTVClicksService(tmdbID);
//         res.json({ clicks: updated.clicks });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: err.message });
//     }
// }
