import express from 'express';
import rateLimit from 'express-rate-limit';
import {
	getAnalyticsSummary,
	recordAnalyticsEvent,
} from '../controllers/analyticsController.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();
const eventLimiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	max: 300,
	message: { error: 'Too many analytics events' },
});

router.post('/events', eventLimiter, recordAnalyticsEvent);
router.post('/admin/summary', verifyAdmin, getAnalyticsSummary);

export default router;
