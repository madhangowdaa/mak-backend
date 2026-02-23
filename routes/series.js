// routes/series.js
import express from 'express';
import {
    addSeriesController,
    updateSeriesController,
    deleteSeriesController,
    getSeriesController,
    handleSeriesClickController
} from '../controllers/seriesController.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public: get series (paginated, searchable)
router.get('/', getSeriesController);

// Click endpoint
router.post('/click/series/:tmdbID', handleSeriesClickController);

// Admin routes
router.post('/add', verifyAdmin, addSeriesController);
router.put('/update', verifyAdmin, updateSeriesController);
router.delete('/delete', verifyAdmin, deleteSeriesController);

export default router;
