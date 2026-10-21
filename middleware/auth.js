export function verifyAdmin(req, res, next) {
	const expectedSecret = process.env.ADMIN_SECRET;
	const providedSecret = req.body?.secret;

	if (!expectedSecret) {
		console.error('ADMIN_SECRET is not configured');
		return res.status(503).json({ error: 'Admin authentication is not configured' });
	}

	if (typeof providedSecret !== 'string' || providedSecret !== expectedSecret) {
		return res.status(403).json({ error: 'Unauthorized' });
	}
	next();
}
