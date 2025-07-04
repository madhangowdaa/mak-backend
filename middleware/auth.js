export function verifyAdmin(req, res, next) {
	const { secret } = req.body;
	if (secret !== process.env.ADMIN_SECRET) {
		return res.status(403).json({ error: 'Unauthorized' });
	}
	next();
}
