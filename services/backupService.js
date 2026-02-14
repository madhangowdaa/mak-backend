// services\backupService.js
import fs from 'fs-extra';
import path from 'path';
import { getDb } from '../db.js';

export async function backupDatabaseService() {
	const db = await getDb();
	const collections = await db.listCollections().toArray();

	const backupDir = path.join(process.cwd(), 'backup');
	await fs.ensureDir(backupDir);

	for (const collectionInfo of collections) {
		const collectionName = collectionInfo.name;
		const documents = await db.collection(collectionName).find({}).toArray();

		if (documents.length > 0) {
			await fs.writeJson(
				path.join(backupDir, `${collectionName}.json`),
				documents,
				{ spaces: 2 },
			);
		}
	}

	return 'Backup completed successfully';
}
