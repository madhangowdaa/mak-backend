// controllers\hdtvController.js
import {
    addHDTVService,
    updateHDTVService,
    deleteHDTVService,
    getHDTVService,
    incrementHDTVClicksService,
    getHDTVByTitleService
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
    try {
        const data = await getHDTVService(req.query);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function handleHDTVClickController(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'HDTV ID required' });
        }

        const show = await incrementHDTVClicksService(id);

        res.status(200).json({
            success: true,
            clicks: show.clicks,
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message,
        });
    }
}

// Search for HDTV by title
export async function getHDTVByTitleController(req, res) {
    const { title } = req.params;

    try {
        const shows = await getHDTVByTitleService(title);
        res.json({ shows });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
}
