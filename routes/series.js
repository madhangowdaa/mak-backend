import express from 'express';
import {
    addSeriesController,
    updateSeriesController,
    deleteSeriesController,
    getAllSeriesController
} from '../controllers/seriesController.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all series
router.get('/', getAllSeriesController);

// Admin routes
router.post('/add', verifyAdmin, addSeriesController);
router.put('/update', verifyAdmin, updateSeriesController);
router.delete('/delete', verifyAdmin, deleteSeriesController);

export default router;
