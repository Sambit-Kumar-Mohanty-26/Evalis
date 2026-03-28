"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lookupInstitution = void 0;
const db_1 = require("../config/db");
// In-Memory Cache Simulation (Production would use Redis)
const cache = new Map();
// Mutex Lock Tracker to prevent Cache Stampedes
const activeFetches = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 Hours
const lookupInstitution = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            res.status(400).json({ error: 'AISHE code is required' });
            return;
        }
        const cacheKey = `aishe:code:${code.toUpperCase()}`;
        const now = Date.now();
        // 1. CHECK CACHE (Fast Path: < 1ms)
        const cachedItem = cache.get(cacheKey);
        if (cachedItem && cachedItem.expiresAt > now) {
            res.status(200).json({ source: 'cache', data: cachedItem.data });
            return;
        }
        // 2. CACHE STAMPEDE PROTECTION (Mutex Lock)
        // If 100 users search "C-12345" at once, only ONE triggers the DB query.
        // The other 99 will wait on this existing Promise!
        if (activeFetches.has(cacheKey)) {
            console.log(`[Stampede Protected] Waiting for existing DB fetch for ${cacheKey}`);
            const data = await activeFetches.get(cacheKey);
            res.status(200).json({ source: 'cache-stampede-protected', data });
            return;
        }
        // 3. DATABASE FETCH (With Promise tracking)
        const fetchPromise = (async () => {
            const data = await db_1.db.aisheDirectory.findUnique({
                where: { aisheCode: code.toUpperCase() }
            });
            if (data) {
                // Save to cache
                cache.set(cacheKey, { data, expiresAt: now + CACHE_TTL });
            }
            return data;
        })();
        // Lock the key
        activeFetches.set(cacheKey, fetchPromise);
        // Wait for the query to finish
        const data = await fetchPromise;
        // Release the lock
        activeFetches.delete(cacheKey);
        if (!data) {
            res.status(404).json({ error: 'Institution not found in AISHE directory' });
            return;
        }
        res.status(200).json({ source: 'database', data });
    }
    catch (error) {
        console.error('Lookup Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.lookupInstitution = lookupInstitution;
