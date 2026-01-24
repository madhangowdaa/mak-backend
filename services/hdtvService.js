// services\hdtvService.js
import fetch from 'node-fetch';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const TMDB_API = process.env.TMDB_API_KEY;

/* ===== TMDB ===== */
async function fetchTMDB(tmdbID) {
	const res = await fetch(
		`https://api.themoviedb.org/3/movie/${tmdbID}?api_key=${TMDB_API}`,
	);
	if (!res.ok) throw new Error('TMDB fetch failed');

	const d = await res.json();
	return {
		title: d.title,
		overview: d.overview,
		poster_path: d.poster_path,
		release_date: d.release_date,
		genres: d.genres?.map((g) => g.name) || [],
	};
}

/* ===== ADD ===== */
export async function addHDTVService(payload) {
	const db = await getDb();
	const hdtv = db.collection('hdtv');

	const {
		tmdbID,
		customData,
		fileLink,
		pinned = false,
		position = 'l', // f | l
	} = payload;

	let data;

	if (tmdbID) {
		const exists = await hdtv.findOne({ tmdbID });
		if (exists) throw new Error('TMDB item already exists');
		data = await fetchTMDB(tmdbID);
	} else if (customData) {
		const exists = await hdtv.findOne({
			isCustom: true,
			title: new RegExp(`^${customData.title}$`, 'i'),
		});
		if (exists) throw new Error('Custom item already exists');
		data = customData;
	} else {
		throw new Error('tmdbID or customData required');
	}

	// 🔥 ORDER LOGIC (same as Movies)
	let order = 0;

	if (position === 'f') {
		const first = await hdtv.find().sort({ order: 1 }).limit(1).toArray();
		order = first.length ? first[0].order - 1 : 0;
	} else {
		const last = await hdtv.find().sort({ order: -1 }).limit(1).toArray();
		order = last.length ? last[0].order + 1 : 0;
	}

	const show = {
		...data,
		tmdbID: tmdbID || null,
		isCustom: !tmdbID,
		fileLink,
		pinned,
		order,
		clicks: 0,
		createdAt: new Date(),
	};

	const result = await hdtv.insertOne(show);
	return { _id: result.insertedId, ...show };
}

// export async function addHDTVService(payload) {
//     const db = await getDb();
//     const hdtv = db.collection("hdtv");

//     const { tmdbID, customData, fileLink, pinned = false } = payload;

//     let data;

//     if (tmdbID) {
//         const exists = await hdtv.findOne({ tmdbID });
//         if (exists) throw new Error("TMDB item already exists");
//         data = await fetchTMDB(tmdbID);
//     } else if (customData) {
//         const exists = await hdtv.findOne({
//             isCustom: true,
//             title: new RegExp(`^${customData.title}$`, "i")
//         });
//         if (exists) throw new Error("Custom item already exists");
//         data = customData;
//     } else {
//         throw new Error("tmdbID or customData required");
//     }

//     const show = {
//         ...data,
//         tmdbID: tmdbID || null,
//         isCustom: !tmdbID,
//         fileLink,
//         pinned,
//         clicks: 0,
//         createdAt: new Date()
//     };

//     const result = await hdtv.insertOne(show);
//     return { _id: result.insertedId, ...show };
// }

/* ===== UPDATE ===== */
export async function updateHDTVService(id, payload) {
	const db = await getDb();
	const hdtv = db.collection('hdtv');

	const existing = await hdtv.findOne({ _id: new ObjectId(id) });
	if (!existing) throw new Error('HDTV not found');

	let data = {};

	// Upgrade custom → TMDB
	if (payload.tmdbID) {
		data = await fetchTMDB(payload.tmdbID);
		data.tmdbID = payload.tmdbID;
		data.isCustom = false;
	}

	// Custom update
	if (payload.customData) {
		data = {
			...payload.customData,
			tmdbID: null,
			isCustom: true,
		};
	}

	//Added support for first or last
	if (payload.position === 'f') {
		const first = await hdtv.find().sort({ order: 1 }).limit(1).toArray();
		data.order = first.length ? first[0].order - 1 : existing.order;
	}

	if (payload.position === 'l') {
		const last = await hdtv.find().sort({ order: -1 }).limit(1).toArray();
		data.order = last.length ? last[0].order + 1 : existing.order;
	}

	const updated = {
		...data,
		order: data.order ?? existing.order,
		fileLink: payload.fileLink ?? existing.fileLink,
		pinned: payload.pinned ?? existing.pinned,
		updatedAt: new Date(),
	};

	await hdtv.updateOne({ _id: new ObjectId(id) }, { $set: updated });

	return { ...existing, ...updated };
}

// export async function updateHDTVService(id, payload) {
//     const db = await getDb();
//     const hdtv = db.collection("hdtv");

//     const existing = await hdtv.findOne({ _id: new ObjectId(id) });
//     if (!existing) throw new Error("HDTV not found");

//     let data = {};
//     if (payload.tmdbID && !existing.isCustom) {
//         data = await fetchTMDB(payload.tmdbID);
//     }
//     if (payload.customData) {
//         data = payload.customData;
//     }

//     const updated = {
//         ...data,
//         fileLink: payload.fileLink ?? existing.fileLink,
//         pinned: payload.pinned ?? existing.pinned,
//         updatedAt: new Date()
//     };

//     await hdtv.updateOne(
//         { _id: new ObjectId(id) },
//         { $set: updated }
//     );

//     return { ...existing, ...updated };
// }

/* ===== DELETE ===== */
export async function deleteHDTVService(id) {
	const db = await getDb();
	const hdtv = db.collection('hdtv');

	const show = await hdtv.findOne({ _id: new ObjectId(id) });
	if (!show) throw new Error('HDTV not found');

	await hdtv.deleteOne({ _id: new ObjectId(id) });
	return show;
}

/* ===== GET ===== */
export async function getHDTVService({ page = 1, limit = 20, q = '' }) {
	const db = await getDb();
	const hdtv = db.collection('hdtv');

	const query = q ? { title: { $regex: q, $options: 'i' } } : {};
	const total = await hdtv.countDocuments(query);

	// const results = await hdtv
	// 	.find(query)
	// 	.sort({ createdAt: -1 })
	// 	.skip((page - 1) * limit)
	// 	.limit(Number(limit))
	// 	.toArray();
	//Added support for first or last
	const results = await hdtv
		.find(query)
		.sort({ pinned: -1, order: 1 })
		.skip((page - 1) * limit)
		.limit(Number(limit))
		.toArray();

	return {
		results,
		totalPages: Math.ceil(total / limit),
		currentPage: Number(page),
	};
}

/* ===== CLICK ===== */
export async function incrementHDTVClicksService(id) {
	const db = await getDb();
	const hdtv = db.collection('hdtv');

	const updated = await hdtv.findOneAndUpdate(
		{ _id: new ObjectId(id) },
		{ $inc: { clicks: 1 } },
		{ returnDocument: 'after' },
	);

	if (!updated.value) throw new Error('HDTV not found');
	return updated.value;
}

/* ===== GET BY TITLE ===== */
export async function getHDTVByTitleService(title) {
	const db = await getDb();
	const hdtv = db.collection('hdtv');

	// Perform a case-insensitive search on title field
	const query = { title: { $regex: `^${title}$`, $options: 'i' } };

	const results = await hdtv.find(query).toArray();

	if (results.length === 0) throw new Error('No matching shows found');

	return results;
}
