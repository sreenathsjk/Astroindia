// lib/redis.ts
// Redis caching layer — daily predictions, transit data, session tokens

import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL! });
    redisClient.on('error', (err) => console.error('[Redis] Error:', err));
    await redisClient.connect();
  }
  return redisClient;
}

// ─── TTL CONSTANTS ────────────────────────────────────────────────────────────
const TTL = {
  DAILY_PREDICTION: 60 * 60 * 6,    // 6 hours
  TRANSIT_DATA:     60 * 60,         // 1 hour
  KUNDLI:           60 * 60 * 24 * 7, // 7 days
  QUOTA:            60 * 60 * 24,    // 24 hours (resets daily)
} as const;

// ─── GENERIC CACHE HELPERS ────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    const value  = await client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (err) {
    console.error('[Redis] cacheGet error:', err);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error('[Redis] cacheSet error:', err);
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.del(key);
  } catch (err) {
    console.error('[Redis] cacheDel error:', err);
  }
}

// ─── DOMAIN-SPECIFIC CACHE FUNCTIONS ─────────────────────────────────────────

/**
 * Cache daily prediction per user per date.
 */
export async function getCachedDailyPrediction(userId: string, date: string) {
  return cacheGet(`daily:${userId}:${date}`);
}

export async function setCachedDailyPrediction(userId: string, date: string, data: unknown) {
  return cacheSet(`daily:${userId}:${date}`, data, TTL.DAILY_PREDICTION);
}

/**
 * Cache current transit data (same for all users — refresh hourly).
 */
export async function getCachedTransits() {
  return cacheGet<Record<string, { sign: string; degree: number }>>('transits:current');
}

export async function setCachedTransits(data: unknown) {
  return cacheSet('transits:current', data, TTL.TRANSIT_DATA);
}

/**
 * Cache kundli data by userId (7-day TTL, invalidate on regenerate).
 */
export async function getCachedKundli(userId: string) {
  return cacheGet(`kundli:${userId}`);
}

export async function setCachedKundli(userId: string, data: unknown) {
  return cacheSet(`kundli:${userId}`, data, TTL.KUNDLI);
}

export async function invalidateKundliCache(userId: string) {
  return cacheDel(`kundli:${userId}`);
}

/**
 * Rate limiting for chat API — track questions per user per day.
 */
export async function getRateLimit(userId: string): Promise<number> {
  const key   = `rate:chat:${userId}:${new Date().toDateString()}`;
  const count = await cacheGet<number>(key);
  return count ?? 0;
}

export async function incrementRateLimit(userId: string): Promise<number> {
  try {
    const client = await getRedisClient();
    const key    = `rate:chat:${userId}:${new Date().toDateString()}`;
    const count  = await client.incr(key);
    // Set TTL on first increment
    if (count === 1) await client.expire(key, TTL.QUOTA);
    return count;
  } catch {
    return 0;
  }
}
