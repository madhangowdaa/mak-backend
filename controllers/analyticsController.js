import { createHash } from 'node:crypto';
import { getDb } from '../db.js';

const EVENTS = new Set([
	'night_picker_view',
	'night_picker_find',
	'night_picker_surprise',
	'night_picker_results',
	'night_picker_movie_click',
	'night_picker_dismiss',
	'notification_banner_view',
	'notification_toast_view',
	'notification_inbox_open',
	'notification_click',
	'notification_dismiss',
	'notification_read',
]);

const DAY_MS = 24 * 60 * 60 * 1000;
let indexesPromise;

const getUtcDay = (date) => date.toISOString().slice(0, 10);

const ensureAnalyticsIndexes = (db) => {
	if (!indexesPromise) {
		indexesPromise = Promise.all([
			db.collection('analytics_daily_counts').createIndex(
				{ day: 1, event: 1, subjectId: 1 },
				{ unique: true },
			),
			db.collection('analytics_daily_visitors').createIndex(
				{ day: 1, event: 1, subjectId: 1, visitorKey: 1 },
				{ unique: true },
			),
			db.collection('analytics_daily_visitors').createIndex(
				{ createdAt: 1 },
				{ expireAfterSeconds: 365 * DAY_MS / 1000 },
			),
		]).catch((error) => {
			indexesPromise = null;
			throw error;
		});
	}
	return indexesPromise;
};

export async function recordAnalyticsEvent(req, res) {
	const { event, visitorId, subjectId } = req.body || {};
	if (!EVENTS.has(event)) {
		return res.status(400).json({ error: 'Unsupported analytics event' });
	}
	if (
		typeof visitorId !== 'string' ||
		!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
			visitorId,
		)
	) {
		return res.status(400).json({ error: 'A valid anonymous visitor ID is required' });
	}
	if (
		subjectId !== undefined &&
		(typeof subjectId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(subjectId))
	) {
		return res.status(400).json({ error: 'Analytics subject ID is invalid' });
	}
	if (event.startsWith('notification_') && !subjectId) {
		return res.status(400).json({ error: 'Notification ID is required for this event' });
	}

	try {
		const now = new Date();
		const day = getUtcDay(now);
		const key = { day, event, subjectId: subjectId || null };
		const visitorKey = createHash('sha256')
			.update(`${day}:${visitorId}`)
			.digest('hex');
		const db = await getDb();
		await ensureAnalyticsIndexes(db);

		await Promise.all([
			db.collection('analytics_daily_counts').updateOne(
				key,
				{ $inc: { count: 1 }, $set: { updatedAt: now } },
				{ upsert: true },
			),
			db.collection('analytics_daily_visitors').updateOne(
				{ ...key, visitorKey },
				{ $setOnInsert: { createdAt: now } },
				{ upsert: true },
			),
		]);

		res.status(202).json({ accepted: true });
	} catch (error) {
		console.error('Failed to record analytics event:', error);
		res.status(500).json({ error: 'Failed to record analytics event' });
	}
}

export async function getAnalyticsSummary(req, res) {
	const requestedDays = Number(req.body?.days);
	const days = Number.isInteger(requestedDays)
		? Math.min(Math.max(requestedDays, 1), 365)
		: 30;
	const from = new Date(Date.now() - (days - 1) * DAY_MS);
	const fromDay = getUtcDay(from);

	try {
		const db = await getDb();
		const [counts, visitors, notificationCounts] = await Promise.all([
			db
				.collection('analytics_daily_counts')
				.aggregate([
					{ $match: { day: { $gte: fromDay } } },
					{
						$group: {
							_id: { day: '$day', event: '$event' },
							count: { $sum: '$count' },
						},
					},
					{ $sort: { '_id.day': 1, '_id.event': 1 } },
				])
				.toArray(),
			db
				.collection('analytics_daily_visitors')
				.aggregate([
					{ $match: { day: { $gte: fromDay } } },
					{
						$group: {
							_id: {
								day: '$day',
								event: '$event',
								visitorKey: '$visitorKey',
							},
						},
					},
					{
						$group: {
							_id: { day: '$_id.day', event: '$_id.event' },
							uniqueVisitors: { $sum: 1 },
						},
					},
					{ $sort: { '_id.day': 1, '_id.event': 1 } },
				])
				.toArray(),
			db
				.collection('analytics_daily_counts')
				.aggregate([
					{
						$match: {
							day: { $gte: fromDay },
							event: { $regex: '^notification_' },
							subjectId: { $ne: null },
						},
					},
					{
						$group: {
							_id: { notificationId: '$subjectId', event: '$event' },
							count: { $sum: '$count' },
						},
					},
					{ $sort: { '_id.notificationId': 1, '_id.event': 1 } },
				])
				.toArray(),
		]);

		res.json({
			days,
			from: fromDay,
			to: getUtcDay(new Date()),
			counts: counts.map((item) => ({
				day: item._id.day,
				event: item._id.event,
				count: item.count,
			})),
			uniqueVisitors: visitors.map((item) => ({
				day: item._id.day,
				event: item._id.event,
				count: item.uniqueVisitors,
			})),
			notifications: notificationCounts.map((item) => ({
				id: item._id.notificationId,
				event: item._id.event,
				count: item.count,
			})),
		});
	} catch (error) {
		console.error('Failed to load analytics summary:', error);
		res.status(500).json({ error: 'Failed to load analytics summary' });
	}
}
