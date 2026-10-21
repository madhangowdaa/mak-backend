import express from 'express';
import {
	createNotification,
	deleteNotification,
	getActiveNotifications,
	listAdminNotifications,
	updateNotification,
} from '../controllers/notificationController.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getActiveNotifications);
router.post('/admin/list', verifyAdmin, listAdminNotifications);
router.post('/', verifyAdmin, createNotification);
router.put('/:id', verifyAdmin, updateNotification);
router.delete('/:id', verifyAdmin, deleteNotification);

export default router;
