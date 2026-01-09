// services/seriesService.js
import { getDb } from '../db.js';
import fetch from 'node-fetch';

/**
 * Add a new series
 * seriesData = {
 *   tmdbID,
 *   title,
 *   overview,
 *   poster_path,
 *   seasons: [
 *     {
 *       seasonNumber,
 *       language: 'en',
 *       versions: [
 *         { quality: '720p', fileLink: '...' },
 *         ...
 *       ]
 *     }
 *   ]
 * }
 */
export async function addSeriesService(seriesData) {
    const db = await getDb();
    const collection = db.collection('series');

    const existing = await collection.findOne({ tmdbID: seriesData.tmdbID });
    if (existing) throw new Error('Series already exists');

    await collection.insertOne(seriesData);
    return seriesData;
}

/**
 * Get all series
 */
export async function getAllSeriesService() {
    const db = await getDb();
    const collection = db.collection('series');
    return collection.find({}).toArray();
}

/**
 * Update series
 * updateData = {
 *   tmdbID,
 *   seasonNumber,
 *   language,
 *   quality,
 *   fileLink
 * }
 */
export async function updateSeriesService(updateData) {
    const { tmdbID, seasonNumber, language, quality, fileLink } = updateData;
    const db = await getDb();
    const collection = db.collection('series');

    const series = await collection.findOne({ tmdbID });
    if (!series) throw new Error('Series not found');

    // Find season
    let season = series.seasons.find(s => s.seasonNumber === seasonNumber && s.language === language);

    if (!season) {
        // If season doesn't exist, create it
        season = { seasonNumber, language, versions: [] };
        series.seasons.push(season);
    }

    // Find version
    const versionIndex = season.versions.findIndex(v => v.quality === quality);
    if (versionIndex >= 0) {
        // Update existing quality
        season.versions[versionIndex].fileLink = fileLink;
    } else {
        // Add new quality
        season.versions.push({ quality, fileLink });
    }

    await collection.updateOne({ tmdbID }, { $set: { seasons: series.seasons } });
    return series;
}

/**
 * Delete series or specific season/quality
 * deleteData = {
 *   tmdbID,
 *   seasonNumber?, // optional
 *   language?, // optional
 *   quality? // optional
 * }
 */
export async function deleteSeriesService(deleteData) {
    const { tmdbID, seasonNumber, language, quality } = deleteData;
    const db = await getDb();
    const collection = db.collection('series');

    const series = await collection.findOne({ tmdbID });
    if (!series) throw new Error('Series not found');

    if (!seasonNumber) {
        // Delete whole series
        await collection.deleteOne({ tmdbID });
        return series;
    }

    // Delete season or quality
    let updated = false;
    series.seasons = series.seasons.map(s => {
        if (s.seasonNumber === seasonNumber && (!language || s.language === language)) {
            if (quality) {
                // Remove only specific quality
                s.versions = s.versions.filter(v => v.quality !== quality);
                updated = true;
                return s;
            } else {
                // Remove whole season
                updated = true;
                return null;
            }
        }
        return s;
    }).filter(Boolean); // remove nulls

    if (!updated) throw new Error('Season/quality not found');

    await collection.updateOne({ tmdbID }, { $set: { seasons: series.seasons } });
    return series;
}
