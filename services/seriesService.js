// services/seriesService.js
import { getDb } from '../db.js';
import fetch from 'node-fetch';

const TMDB_API = process.env.TMDB_API_KEY;

// ---------------- Add Series ----------------
export async function addSeriesService(seriesData) {
    const db = await getDb();
    const collection = db.collection('series');

    const existing = await collection.findOne({ tmdbID: seriesData.tmdbID });
    if (existing) throw new Error('Series already exists');

    // Fetch TMDb series info
    const tmdbInfo = await fetchTMDBSeries(seriesData.tmdbID);

    const newSeries = {
        ...tmdbInfo,
        ...seriesData, // includes title, seasons, secret
    };

    await collection.insertOne(newSeries);
    return newSeries;
}

// ---------------- Get All Series ----------------
export async function getAllSeriesService() {
    const db = await getDb();
    const collection = db.collection('series');
    return collection.find({}).toArray();
}

// ---------------- Update Series ----------------
export async function updateSeriesService(updateData) {
    const { tmdbID, seasonNumber, language, quality, fileLink } = updateData;
    const db = await getDb();
    const collection = db.collection('series');

    const series = await collection.findOne({ tmdbID });
    if (!series) throw new Error('Series not found');

    // Fetch latest TMDb info
    const tmdbInfo = await fetchTMDBSeries(tmdbID);

    // Find or create season
    let season = series.seasons.find(
        s => s.seasonNumber === seasonNumber && s.language === language
    );

    if (!season) {
        season = { seasonNumber, language, versions: [] };
        series.seasons.push(season);
    }

    // Update or add quality
    const versionIndex = season.versions.findIndex(v => v.quality === quality);
    if (versionIndex >= 0) {
        season.versions[versionIndex].fileLink = fileLink;
    } else {
        season.versions.push({ quality, fileLink });
    }

    const updatedSeries = { ...series, ...tmdbInfo };
    await collection.updateOne({ tmdbID }, { $set: updatedSeries });
    return updatedSeries;
}

// ---------------- Delete Series ----------------
export async function deleteSeriesService(deleteData) {
    const { tmdbID, seasonNumber, language, quality } = deleteData;
    const db = await getDb();
    const collection = db.collection('series');

    const series = await collection.findOne({ tmdbID });
    if (!series) throw new Error('Series not found');

    if (!seasonNumber) {
        await collection.deleteOne({ tmdbID });
        return series;
    }

    // Delete season or quality
    let updated = false;
    series.seasons = series.seasons
        .map(s => {
            if (s.seasonNumber === seasonNumber && (!language || s.language === language)) {
                if (quality) {
                    s.versions = s.versions.filter(v => v.quality !== quality);
                    updated = true;
                    return s;
                } else {
                    updated = true;
                    return null;
                }
            }
            return s;
        })
        .filter(Boolean);

    if (!updated) throw new Error('Season/quality not found');

    await collection.updateOne({ tmdbID }, { $set: { seasons: series.seasons } });
    return series;
}

// ---------------- Helper: Fetch TMDb Series ----------------
async function fetchTMDBSeries(tmdbID) {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbID}?api_key=${TMDB_API}`);
    if (!res.ok) throw new Error('Failed to fetch TMDb series data');

    const data = await res.json();
    return {
        title: data.name,
        overview: data.overview,
        poster_path: data.poster_path,
        release_date: data.first_air_date,
        genres: data.genres?.map(g => g.name) || [],
    };
}
