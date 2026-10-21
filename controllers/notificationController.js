import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const COLLECTION = 'notifications';
const NOTIFICATION_TYPES = new Set(['announcement', 'new-release', 'site-update']);
const DISPLAY_STYLES = new Set(['banner', 'toast']);

const parseDate = (value, fieldName) => {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`${fieldName} must be a valid date`);
	}
	return date;
};

const validateNotification = (body) => {
	const title = typeof body.title === 'string' ? body.title.trim() : '';
	const message = typeof body.message === 'string' ? body.message.trim() : '';
	const type = body.type || 'announcement';
	const displayStyle = body.displayStyle || 'banner';
	const link = typeof body.link === 'string' ? body.link.trim() : '';

	if (!title || title.length > 100) {
		throw new Error('Title is required and must be 100 characters or fewer');
	}
	if (!message || message.length > 500) {
		throw new Error('Message is required and must be 500 characters or fewer');
	}
	if (!NOTIFICATION_TYPES.has(type)) {
		throw new Error('Notification type is invalid');
	}
	if (!DISPLAY_STYLES.has(displayStyle)) {
		throw new Error('Display style must be banner or toast');
	}
	if (
		link &&
		(!/^\/(?![\\/])/.test(link)) &&
		!/^https:\/\/[^\s]+$/i.test(link)
	) {
		throw new Error('Link must be a site path or an HTTPS URL');
	}

	const startsAt = parseDate(body.startsAt, 'Start time');
	const expiresAt = parseDate(body.expiresAt, 'Expiry time');
	if (startsAt && expiresAt && expiresAt <= startsAt) {
		throw new Error('Expiry time must be after the start time');
	}

	return {
		title,
		message,
		type,
		displayStyle,
		link,
		startsAt,
		expiresAt,
		isActive: body.isActive !== false,
	};
};

const badRequest = (res, error) => res.status(400).json({ error: error.message });

export async function getActiveNotifications(req, res) {
	try {
		const now = new Date();
		const db = await getDb();
		const notifications = await db
			.collection(COLLECTION)
			.find({
				isActive: true,
				$and: [
					{ $or: [{ startsAt: null }, { startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
					{ $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] },
				],
			})
			.sort({ createdAt: -1 })
			.toArray();

		res.json(notifications);
	} catch (error) {
		console.error('Failed to load notifications:', error);
		res.status(500).json({ error: 'Failed to load notifications' });
	}
}

export async function listAdminNotifications(req, res) {
	try {
		const db = await getDb();
		const notifications = await db
			.collection(COLLECTION)
			.find({})
			.sort({ createdAt: -1 })
			.toArray();
		res.json(notifications);
	} catch (error) {
		console.error('Failed to load admin notifications:', error);
		res.status(500).json({ error: 'Failed to load notifications' });
	}
}

export async function createNotification(req, res) {
	let notification;
	try {
		notification = validateNotification(req.body);
	} catch (error) {
		return badRequest(res, error);
	}

	try {
		const now = new Date();
		const record = { ...notification, createdAt: now, updatedAt: now };
		const db = await getDb();
		const result = await db.collection(COLLECTION).insertOne(record);
		res.status(201).json({ ...record, _id: result.insertedId });
	} catch (error) {
		console.error('Failed to create notification:', error);
		res.status(500).json({ error: 'Failed to create notification' });
	}
}

export async function updateNotification(req, res) {
	if (!ObjectId.isValid(req.params.id)) {
		return res.status(400).json({ error: 'Notification ID is invalid' });
	}

	let notification;
	try {
		notification = validateNotification(req.body);
	} catch (error) {
		return badRequest(res, error);
	}

	try {
		const db = await getDb();
		const result = await db.collection(COLLECTION).findOneAndUpdate(
			{ _id: new ObjectId(req.params.id) },
			{ $set: { ...notification, updatedAt: new Date() } },
			{ returnDocument: 'after' },
		);
		if (!result.value) {
			return res.status(404).json({ error: 'Notification not found' });
		}
		res.json(result.value);
	} catch (error) {
		console.error('Failed to update notification:', error);
		res.status(500).json({ error: 'Failed to update notification' });
	}
}

export async function deleteNotification(req, res) {
	if (!ObjectId.isValid(req.params.id)) {
		return res.status(400).json({ error: 'Notification ID is invalid' });
	}

	try {
		const db = await getDb();
		const result = await db
			.collection(COLLECTION)
			.deleteOne({ _id: new ObjectId(req.params.id) });
		if (!result.deletedCount) {
			return res.status(404).json({ error: 'Notification not found' });
		}
		res.json({ message: 'Notification deleted' });
	} catch (error) {
		console.error('Failed to delete notification:', error);
		res.status(500).json({ error: 'Failed to delete notification' });
	}
}
