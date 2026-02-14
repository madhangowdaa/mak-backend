// routes\backup.js
import express from 'express';
import { backupController } from '../controllers/backupController.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/backup', backupController);

export default router;
