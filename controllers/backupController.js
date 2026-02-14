// controllers\backupController.js
import { backupDatabaseService } from '../services/backupService.js';

export async function backupController(req, res) {
	try {
		const message = await backupDatabaseService();
		res.json({ success: true, message });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: error.message });
	}
}
