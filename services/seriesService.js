// services/seriesService.js
import { getDb } from '../db.js';
import fetch from 'node-fetch';
import { LANGUAGE_MAP } from '../utils/languageMap.js';

const TMDB_API = process.env.TMDB_API_KEY;

// ---------------- Get Series with Pagination + Search + Sort ----------------
export async function getSeriesService({
	page = 1,
	limit = 20,
	q = '',
	sort = 'latest',
}) {
	const db = await getDb();
	const collection = db.collection('series');

	const query = q ? { title: { $regex: q, $options: 'i' } } : {};
	const totalSeries = await collection.countDocuments(query);

	// Sorting
	let sortOption = {};
	if (sort === 'latest') {
		sortOption = { order: -1, _id: -1 };
	} else if (sort === 'oldest') {
		sortOption = { order: 1, _id: 1 };
	} else if (sort === 'pinned') {
		sortOption = { pinned: -1, order: -1, _id: -1 };
	}
	const results = await collection
		.find(query)
		.sort(sortOption)
		.skip((page - 1) * limit)
		.limit(limit)
		.toArray();

	const totalPages = Math.ceil(totalSeries / limit);
	return { results, totalPages, currentPage: page };
}

// ---------------- Add Series ----------------
export async function addSeriesService(seriesData, options = {}) {
	const db = await getDb();
	const collection = db.collection('series');

	const existing = await collection.findOne({ tmdbID: seriesData.tmdbID });
	if (existing) throw new Error('Series already exists');

	const tmdbInfo = await fetchTMDBSeries(seriesData.tmdbID);

	const seasons = (seriesData.seasons || []).map((season) => ({
		seasonNumber: season.seasonNumber,
		language: season.language,
		languageName: LANGUAGE_MAP[season.language] || season.language,
		versions: (season.versions || []).map((v) => ({
			quality: v.quality,
			fileLink: v.fileLink,
		})),
	}));

	const { position = 'l', pinned = false } = options;

	let order = Date.now();
	if (position === 'f') {
		const first = await collection.find().sort({ order: 1 }).limit(1).toArray();
		order = first.length ? first[0].order - 1 : order;
	} else if (position === 'l') {
		const last = await collection.find().sort({ order: -1 }).limit(1).toArray();
		order = last.length ? last[0].order + 1 : order;
	}

	const newSeries = {
		tmdbID: seriesData.tmdbID,
		...tmdbInfo,
		seasons,
		pinned,
		order,
		clicks: 0,
		createdAt: new Date(),
	};

	await collection.insertOne(newSeries);
	return newSeries;
}

// ---------------- Update Series ----------------
export async function updateSeriesService(updateData, options = {}) {
	const { tmdbID, seasonNumber, language, quality, fileLink } = updateData;
	const { position, pinned } = options;

	const db = await getDb();
	const collection = db.collection('series');

	const series = await collection.findOne({ tmdbID });
	if (!series) throw new Error('Series not found');

	// Update pinned
	if (pinned !== undefined) series.pinned = pinned;

	// Update order
	if (position) {
		let order = series.order;
		if (position === 'f') {
			const first = await collection
				.find()
				.sort({ order: 1 })
				.limit(1)
				.toArray();
			order = first.length ? first[0].order - 1 : order;
		} else if (position === 'l') {
			const last = await collection
				.find()
				.sort({ order: -1 })
				.limit(1)
				.toArray();
			order = last.length ? last[0].order + 1 : order;
		}
		series.order = order;
	}

	// Update season/version if provided
	if (seasonNumber && language && quality && fileLink) {
		let season = series.seasons.find(
			(s) => s.seasonNumber === seasonNumber && s.language === language,
		);

		if (!season) {
			season = {
				seasonNumber,
				language,
				languageName: LANGUAGE_MAP[language] || language,
				versions: [],
			};
			series.seasons.push(season);
		}

		const existingVersion = season.versions.find((v) => v.quality === quality);
		if (existingVersion) existingVersion.fileLink = fileLink;
		else season.versions.push({ quality, fileLink });
	}

	await collection.updateOne({ tmdbID }, { $set: series });
	return series;
}

// ---------------- Delete Series ----------------
export async function deleteSeriesService(deleteData) {
	const { tmdbID, seasonNumber, language, quality } = deleteData;
	const db = await getDb();
	const collection = db.collection('series');

	const series = await collection.findOne({ tmdbID });
	if (!series) throw new Error('Series not found');

	// Delete entire series
	if (!seasonNumber) {
		await collection.deleteOne({ tmdbID });
		return series;
	}

	let updated = false;
	series.seasons = series.seasons
		.map((season) => {
			if (
				season.seasonNumber === seasonNumber &&
				(!language || season.language === language)
			) {
				if (quality) {
					season.versions = season.versions.filter(
						(v) => v.quality !== quality,
					);
					updated = true;
					return season.versions.length ? season : null;
				} else {
					updated = true;
					return null;
				}
			}
			return season;
		})
		.filter(Boolean);

	if (!updated) throw new Error('Season / quality not found');

	await collection.updateOne({ tmdbID }, { $set: { seasons: series.seasons } });
	return series;
}

// ---------------- Helper: Fetch TMDb Series ----------------
async function fetchTMDBSeries(tmdbID) {
	const res = await fetch(
		`https://api.themoviedb.org/3/tv/${tmdbID}?api_key=${TMDB_API}`,
	);
	if (!res.ok) throw new Error('Failed to fetch TMDb series data');

	const data = await res.json();
	return {
		title: data.name,
		overview: data.overview,
		poster_path: data.poster_path,
		release_date: data.first_air_date,
		genres: data.genres?.map((g) => g.name) || [],
	};
}

// ---------------- Increment Series Clicks ----------------
export async function incrementSeriesClicksService(tmdbID) {
	const db = await getDb();
	const collection = db.collection('series');

	const updated = await collection.findOneAndUpdate(
		{ tmdbID: Number(tmdbID) }, // ensure number match
		{ $inc: { clicks: 1 } }, // atomic increment
		{ returnDocument: 'after' }, // return updated document
	);

	if (!updated.value) {
		throw new Error('Series not found');
	}

	return updated.value; // contains updated clicks
}
