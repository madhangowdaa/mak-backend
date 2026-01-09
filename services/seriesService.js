// services/seriesService.js
import { getDb } from '../db.js';
import fetch from 'node-fetch';
import { LANGUAGE_MAP } from '../utils/languageMap.js';

const TMDB_API = process.env.TMDB_API_KEY;

// ---------------- Get All Series ----------------
export async function getAllSeriesService() {
    const db = await getDb();
    const collection = db.collection('series');
    return collection.find({}).toArray();
}

// ---------------- Add Series ----------------
export async function addSeriesService(seriesData) {
    const db = await getDb();
    const collection = db.collection('series');

    const existing = await collection.findOne({ tmdbID: seriesData.tmdbID });
    if (existing) throw new Error('Series already exists');

    const tmdbInfo = await fetchTMDBSeries(seriesData.tmdbID);

    const seasons = (seriesData.seasons || []).map(season => ({
        seasonNumber: season.seasonNumber,
        language: season.language,
        languageName: LANGUAGE_MAP[season.language] || season.language,
        versions: (season.versions || []).map(v => ({
            quality: v.quality,
            fileLink: v.fileLink,
        })),
    }));

    const newSeries = {
        tmdbID: seriesData.tmdbID,
        ...tmdbInfo,
        seasons,
    };

    await collection.insertOne(newSeries);
    return newSeries;
}

// ---------------- Update Series ----------------
export async function updateSeriesService(updateData) {
    const { tmdbID, seasonNumber, language, quality, fileLink } = updateData;
    const db = await getDb();
    const collection = db.collection('series');

    const series = await collection.findOne({ tmdbID });
    if (!series) throw new Error('Series not found');

    // Find or create season
    let season = series.seasons.find(
        s => s.seasonNumber === seasonNumber && s.language === language
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

    // Add or update quality dynamically
    const existingVersion = season.versions.find(v => v.quality === quality);
    if (existingVersion) {
        existingVersion.fileLink = fileLink;
    } else {
        season.versions.push({ quality, fileLink });
    }

    await collection.updateOne(
        { tmdbID },
        { $set: { seasons: series.seasons } }
    );

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
        .map(season => {
            if (
                season.seasonNumber === seasonNumber &&
                (!language || season.language === language)
            ) {
                if (quality) {
                    season.versions = season.versions.filter(v => v.quality !== quality);
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

    await collection.updateOne(
        { tmdbID },
        { $set: { seasons: series.seasons } }
    );

    return series;
}

// ---------------- Helper: Fetch TMDb Series ----------------
async function fetchTMDBSeries(tmdbID) {
    const res = await fetch(
        `https://api.themoviedb.org/3/tv/${tmdbID}?api_key=${TMDB_API}`
    );
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
