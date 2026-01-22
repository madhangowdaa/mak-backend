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
    const data = await getHDTVService(req.query);
    res.json(data);
}

export async function handleHDTVClickController(req, res) {
    const show = await incrementHDTVClicksService(req.params.id);
    res.json({ clicks: show.clicks });
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
