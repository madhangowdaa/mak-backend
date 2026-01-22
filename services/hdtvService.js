import fetch from "node-fetch";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

const TMDB_API = process.env.TMDB_API_KEY;

/* ===== TMDB ===== */
async function fetchTMDB(tmdbID) {
    const res = await fetch(
        `https://api.themoviedb.org/3/movie/${tmdbID}?api_key=${TMDB_API}`
    );
    if (!res.ok) throw new Error("TMDB fetch failed");

    const d = await res.json();
    return {
        title: d.title,
        overview: d.overview,
        poster_path: d.poster_path,
        release_date: d.release_date,
        genres: d.genres?.map(g => g.name) || []
    };
}

/* ===== ADD ===== */
export async function addHDTVService(payload) {
    const db = await getDb();
    const hdtv = db.collection("hdtv");

    const { tmdbID, customData, fileLink, pinned = false } = payload;

    let data;

    if (tmdbID) {
        const exists = await hdtv.findOne({ tmdbID });
        if (exists) throw new Error("TMDB item already exists");
        data = await fetchTMDB(tmdbID);
    } else if (customData) {
        const exists = await hdtv.findOne({
            isCustom: true,
            title: new RegExp(`^${customData.title}$`, "i")
        });
        if (exists) throw new Error("Custom item already exists");
        data = customData;
    } else {
        throw new Error("tmdbID or customData required");
    }

    const show = {
        ...data,
        tmdbID: tmdbID || null,
        isCustom: !tmdbID,
        fileLink,
        pinned,
        clicks: 0,
        createdAt: new Date()
    };

    const result = await hdtv.insertOne(show);
    return { _id: result.insertedId, ...show };
}

/* ===== UPDATE ===== */
export async function updateHDTVService(id, payload) {
    const db = await getDb();
    const hdtv = db.collection("hdtv");

    const existing = await hdtv.findOne({ _id: new ObjectId(id) });
    if (!existing) throw new Error("HDTV not found");

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
            isCustom: true
        };
    }

    const updated = {
        ...data,
        fileLink: payload.fileLink ?? existing.fileLink,
        pinned: payload.pinned ?? existing.pinned,
        updatedAt: new Date()
    };

    await hdtv.updateOne(
        { _id: new ObjectId(id) },
        { $set: updated }
    );

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
    const hdtv = db.collection("hdtv");

    const show = await hdtv.findOne({ _id: new ObjectId(id) });
    if (!show) throw new Error("HDTV not found");

    await hdtv.deleteOne({ _id: new ObjectId(id) });
    return show;
}

/* ===== GET ===== */
export async function getHDTVService({ page = 1, limit = 20, q = "" }) {
    const db = await getDb();
    const hdtv = db.collection("hdtv");

    const query = q ? { title: { $regex: q, $options: "i" } } : {};
    const total = await hdtv.countDocuments(query);

    const results = await hdtv
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .toArray();

    return {
        results,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page)
    };
}

/* ===== CLICK ===== */
export async function incrementHDTVClicksService(id) {
    const db = await getDb();
    const hdtv = db.collection("hdtv");

    const updated = await hdtv.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $inc: { clicks: 1 } },
        { returnDocument: "after" }
    );

    if (!updated.value) throw new Error("HDTV not found");
    return updated.value;
}

// // services\hdtvService.js
// import fetch from "node-fetch";
// import { getDb } from "../db.js";

// const TMDB_API = process.env.TMDB_API_KEY;

// /* ===== TMDB FETCH ===== */
// async function fetchTMDB(tmdbID) {
//     const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbID}?api_key=${TMDB_API}`);
//     if (!res.ok) throw new Error("Failed to fetch TMDb data");

//     const data = await res.json();
//     return {
//         title: data.name, // TV shows use `name`
//         overview: data.overview,
//         poster_path: data.poster_path,
//         release_date: data.first_air_date,
//         genres: data.genres?.map(g => g.name) || [],
//     };
// }

// /* ===== ADD HDTV ===== */
// export async function addHDTVService(tmdbID, fileLink, options = {}, customData = null) {
//     const db = await getDb();
//     const hdtv = db.collection("hdtv");

//     if (tmdbID && await hdtv.findOne({ tmdbID })) {
//         throw new Error("HDTV show already exists");
//     }

//     let data;
//     if (customData) {
//         data = customData;
//     } else if (tmdbID) {
//         data = await fetchTMDB(tmdbID);
//     } else {
//         throw new Error("Either tmdbID or customData must be provided");
//     }

//     // Determine order
//     let order = 0;
//     if (options.position === "f") {
//         const first = await hdtv.find().sort({ order: 1 }).limit(1).toArray();
//         order = first.length ? first[0].order - 1 : 0;
//     } else {
//         const last = await hdtv.find().sort({ order: -1 }).limit(1).toArray();
//         order = last.length ? last[0].order + 1 : 0;
//     }

//     const show = {
//         ...data,
//         tmdbID: tmdbID || `custom-${Date.now()}`,
//         fileLink,
//         pinned: Boolean(options.pinned),
//         order,
//         trending: options.trending || { isTrending: false, trendingOrder: 0 },
//         clicks: 0,
//         createdAt: new Date(),
//         isCustom: !!customData,
//     };

//     await hdtv.insertOne(show);
//     return show;
// }

// /* ===== UPDATE HDTV ===== */
// export async function updateHDTVService(tmdbID, fileLink, options = {}, customData = null) {
//     const db = await getDb();
//     const hdtv = db.collection("hdtv");

//     const existing = await hdtv.findOne({ tmdbID });
//     if (!existing) throw new Error("HDTV show not found");

//     let data;
//     if (customData) {
//         data = customData;
//     } else if (tmdbID) {
//         data = await fetchTMDB(tmdbID);
//     } else {
//         throw new Error("Either tmdbID or customData must be provided");
//     }

//     let order = existing.order;
//     if (options.position === "f") {
//         const first = await hdtv.find().sort({ order: 1 }).limit(1).toArray();
//         order = first.length ? first[0].order - 1 : order;
//     }
//     if (options.position === "l") {
//         const last = await hdtv.find().sort({ order: -1 }).limit(1).toArray();
//         order = last.length ? last[0].order + 1 : order;
//     }

//     const updated = {
//         ...data,
//         tmdbID: existing.tmdbID,
//         fileLink,
//         pinned: typeof options.pinned === "boolean" ? options.pinned : existing.pinned,
//         order,
//         trending: options.trending || existing.trending || { isTrending: false, trendingOrder: 0 },
//         updatedAt: new Date(),
//         isCustom: customData ? true : existing.isCustom,
//     };

//     await hdtv.updateOne({ tmdbID }, { $set: updated });
//     return updated;
// }

// /* ===== DELETE HDTV ===== */
// export async function deleteHDTVService(tmdbID) {
//     const db = await getDb();
//     const hdtv = db.collection("hdtv");

//     const show = await hdtv.findOne({ tmdbID });
//     if (!show) throw new Error("HDTV show not found");

//     await hdtv.deleteOne({ tmdbID });
//     return show;
// }

// /* ===== GET ALL HDTV ===== */
// export async function getHDTVService({ page = 1, limit = 20, q = "", sort = "latest" }) {
//     const db = await getDb();
//     const hdtv = db.collection("hdtv");

//     const query = q ? { title: { $regex: q, $options: "i" } } : {};
//     const total = await hdtv.countDocuments(query);

//     let sortOption = { order: 1 };
//     if (sort === "latest") sortOption = { order: 1, createdAt: -1 };
//     if (sort === "oldest") sortOption = { order: -1, createdAt: 1 };
//     if (sort === "pinned") sortOption = { pinned: -1, order: 1 };

//     const results = await hdtv
//         .find(query)
//         .sort(sortOption)
//         .skip((page - 1) * limit)
//         .limit(limit)
//         .toArray();

//     return {
//         results: results.map(m => ({
//             id: m.tmdbID,
//             ...m
//         })),
//         totalPages: Math.ceil(total / limit),
//         currentPage: page,
//     };
// }

// /* ===== INCREMENT CLICKS ===== */
// export async function incrementHDTVClicksService(tmdbID) {
//     const db = await getDb();
//     const hdtv = db.collection("hdtv");

//     const show = await hdtv.findOne({ tmdbID });
//     if (!show) throw new Error("HDTV show not found");

//     const updated = await hdtv.findOneAndUpdate(
//         { tmdbID },
//         { $inc: { clicks: 1 } },
//         { returnDocument: "after" }
//     );

//     return updated.value;
// }
