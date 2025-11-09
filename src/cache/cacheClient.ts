import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || '';
let client: Redis | null = null;
let fallback = new Map<string, string>();

if (redisUrl) {
  try {
    client = new Redis(redisUrl);
  } catch (err) {
    console.warn('Redis init failed, falling back to in-memory cache', err);
    client = null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds = 30) {
  const s = JSON.stringify(value);
  if (client) {
    await client.set(key, s, 'EX', ttlSeconds);
  } else {
    fallback.set(key, s);
    setTimeout(() => fallback.delete(key), ttlSeconds * 1000);
  }
}

export async function cacheGet(key: string) {
  if (client) {
    const v = await client.get(key);
    return v ? JSON.parse(v) : null;
  } else {
    const v = fallback.get(key);
    return v ? JSON.parse(v) : null;
  }
}
