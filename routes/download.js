import express from 'express';
import {
	generateDownloadToken,
	resolveDownloadToken,
} from '../controllers/downloadController.js';

const router = express.Router();

router.get('/generate/:tmdbID', generateDownloadToken);
router.get('/resolve/:token', resolveDownloadToken);

export default router;
