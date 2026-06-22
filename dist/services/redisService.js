"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCachePattern = exports.deleteCache = exports.setCache = exports.getCache = exports.connectRedis = void 0;
const redis_1 = require("redis");
const client = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
client.on('error', (err) => {
    console.error('❌ Redis Client Error:', err.message);
});
client.on('connect', () => {
    console.log('✅ Redis connected');
});
const connectRedis = async () => {
    try {
        await client.connect();
    }
    catch (err) {
        console.error('❌ Failed to connect to Redis:', err);
    }
};
exports.connectRedis = connectRedis;
// ─── Cache helpers ────────────────────────────────────────────────────────────
const getCache = async (key) => {
    try {
        return await client.get(key);
    }
    catch {
        return null;
    }
};
exports.getCache = getCache;
const setCache = async (key, value, ttlSeconds = 300) => {
    try {
        await client.setEx(key, ttlSeconds, value);
    }
    catch (err) {
        console.error('Redis setCache error:', err);
    }
};
exports.setCache = setCache;
const deleteCache = async (key) => {
    try {
        await client.del(key);
    }
    catch (err) {
        console.error('Redis deleteCache error:', err);
    }
};
exports.deleteCache = deleteCache;
const deleteCachePattern = async (pattern) => {
    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
            console.log(`🗑  Invalidated ${keys.length} cache key(s) matching: ${pattern}`);
        }
    }
    catch (err) {
        console.error('Redis deleteCachePattern error:', err);
    }
};
exports.deleteCachePattern = deleteCachePattern;
exports.default = client;
//# sourceMappingURL=redisService.js.map