// services\hdtvService.js
import fetch from "node-fetch";
import { getDb } from "../db.js";

const TMDB_API = process.env.TMDB_API_KEY;

/* ===== TMDB FETCH ===== */
async function fetchTMDB(tmdbID) {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbID}?api_key=${TMDB_API}`);
    if (!res.ok) throw new Error("Failed to fetch TMDb data");

    const data = await res.json();
    return {
        title: data.name, // TV shows use `name`
        overview: data.overview,
        poster_path: data.poster_path,
        release_date: data.first_air_date,
        genres: data.genres?.map(g => g.name) || [],
    };
}

/* ===== ADD HDTV ===== */
export async function addHDTVService(tmdbID, fileLink, options = {}, customData = null) {
    const db = await getDb();
    const hdtv = db.collection("hdtv");

    if (tmdbID && await hdtv.findOne({ tmdbID })) {
        throw new Error("HDTV show already exists");
    }

    let data;
    if (customData) {
        data = customData;
    } else if (tmdbID) {
        data = await fetchTMDB(tmdbID);
    } else {
        throw new Error("Either tmdbID or customData must be provided");
    }

    // Determine order
    let order = 0;
    if (options.position === "f") {
        const first = await hdtv.find().sort({ order: 1 }).limit(1).toArray();
        order = first.length ? first[0].order - 1 : 0;
    } else {
        const last = await hdtv.find().sort({ order: -1 }).limit(1).toArray();
        order = last.length ? last[0].order + 1 : 0;
    }

    const show = {
        ...data,
        tmdbID: tmdbID || `custom-${Date.now()}`,
        fileLink,
        pinned: Boolean(options.pinned),
        order,
        trending: options.trending || { isTrending: false, trendingOrder: 0 },
        clicks: 0,
        createdAt: new Date(),
        isCustom: !!customData,
    };

    await hdtv.insertOne(show);
    return show;
}

/* ===== UPDATE HDTV ===== */
export async function updateHDTVService(tmdbID, fileLink, options = {}, customData = null) {
    const db = await getDb();
    const hdtv = db.collection("hdtv");

    const existing = await hdtv.findOne({ tmdbID });
    if (!existing) throw new Error("HDTV show not found");

    let data;
    if (customData) {
        data = customData;
    } else if (tmdbID) {
        data = await fetchTMDB(tmdbID);
    } else {
        throw new Error("Either tmdbID or customData must be provided");
    }

    let order = existing.order;
    if (options.position === "f") {
        const first = await hdtv.find().sort({ order: 1 }).limit(1).toArray();
        order = first.length ? first[0].order - 1 : order;
    }
    if (options.position === "l") {
        const last = await hdtv.find().sort({ order: -1 }).limit(1).toArray();
        order = last.length ? last[0].order + 1 : order;
    }

    const updated = {
        ...data,
        tmdbID: existing.tmdbID,
        fileLink,
        pinned: typeof options.pinned === "boolean" ? options.pinned : existing.pinned,
        order,
        trending: options.trending || existing.trending || { isTrending: false, trendingOrder: 0 },
        updatedAt: new Date(),
        isCustom: customData ? true : existing.isCustom,
    };

    await hdtv.updateOne({ tmdbID }, { $set: updated });
    return updated;
}

/* ===== DELETE HDTV ===== */
export async function deleteHDTVService(tmdbID) {
    const db = await getDb();
    const hdtv = db.collection("hdtv");

    const show = await hdtv.findOne({ tmdbID });
    if (!show) throw new Error("HDTV show not found");

    await hdtv.deleteOne({ tmdbID });
    return show;
}

/* ===== GET ALL HDTV ===== */
export async function getHDTVService({ page = 1, limit = 20, q = "", sort = "latest" }) {
    const db = await getDb();
    const hdtv = db.collection("hdtv");

    const query = q ? { title: { $regex: q, $options: "i" } } : {};
    const total = await hdtv.countDocuments(query);

    let sortOption = { order: 1 };
    if (sort === "latest") sortOption = { order: 1, createdAt: -1 };
    if (sort === "oldest") sortOption = { order: -1, createdAt: 1 };
    if (sort === "pinned") sortOption = { pinned: -1, order: 1 };

    const results = await hdtv
        .find(query)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

    return {
        results: results.map(m => ({
            id: m.tmdbID,
            ...m
        })),
        totalPages: Math.ceil(total / limit),
        currentPage: page,
    };
}

/* ===== INCREMENT CLICKS ===== */
export async function incrementHDTVClicksService(tmdbID) {
    const db = await getDb();
    const hdtv = db.collection("hdtv");

    const show = await hdtv.findOne({ tmdbID });
    if (!show) throw new Error("HDTV show not found");

    const updated = await hdtv.findOneAndUpdate(
        { tmdbID },
        { $inc: { clicks: 1 } },
        { returnDocument: "after" }
    );

    return updated.value;
}
