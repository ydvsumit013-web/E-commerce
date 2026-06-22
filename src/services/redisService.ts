import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
});

client.on('connect', () => {
  console.log('✅ Redis connected');
});

export const connectRedis = async () => {
  try {
    await client.connect();
  } catch (err) {
    console.log('⚠️  Redis connection failed. Falling back to simulated in-memory cache.');
  }
};

// ─── Cache helpers (with local memory fallback) ────────────────────────────────

const memoryCache = new Map<string, { value: string; expiresAt: number }>();

export const getCache = async (key: string): Promise<string | null> => {
  if (!client.isOpen) {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  }
  try {
    return await client.get(key);
  } catch {
    return null;
  }
};

export const setCache = async (key: string, value: string, ttlSeconds = 300): Promise<void> => {
  if (!client.isOpen) {
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
    });
    return;
  }
  try {
    await client.setEx(key, ttlSeconds, value);
  } catch (err) {
    console.error('Redis setCache error:', err);
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  if (!client.isOpen) {
    memoryCache.delete(key);
    return;
  }
  try {
    await client.del(key);
  } catch (err) {
    console.error('Redis deleteCache error:', err);
  }
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  if (!client.isOpen) {
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    let count = 0;
    for (const key of memoryCache.keys()) {
      if (regexPattern.test(key)) {
        memoryCache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      console.log(`🗑  [Memory Cache] Invalidated ${count} cache key(s) matching: ${pattern}`);
    }
    return;
  }
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`🗑  Invalidated ${keys.length} cache key(s) matching: ${pattern}`);
    }
  } catch (err) {
    console.error('Redis deleteCachePattern error:', err);
  }
};

export default client;
