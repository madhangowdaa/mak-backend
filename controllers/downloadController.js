import { getDb } from '../db.js';
import crypto from 'crypto';

export async function generateDownloadToken(req, res) {
	const { tmdbID } = req.params;
	const db = await getDb();

	const movie = await db.collection('movies').findOne({
		tmdbID: Number(tmdbID),
	});

	if (!movie || !movie.fileLink) {
		return res.status(404).json({ error: 'Movie not found' });
	}

	const token = crypto.randomBytes(16).toString('hex');

	await db.collection('download_tokens').insertOne({
		token,
		fileLink: movie.fileLink,
		expiresAt: Date.now() + 1000 * 60, // 1 minute
	});

	res.json({ token });
}

export async function resolveDownloadToken(req, res) {
	const { token } = req.params;
	const db = await getDb();

	const record = await db.collection('download_tokens').findOne({ token });

	if (!record) {
		return res.status(404).json({ error: 'Invalid token' });
	}

	if (record.expiresAt < Date.now()) {
		return res.status(403).json({ error: 'Token expired' });
	}

	res.json({ url: record.fileLink });
}
