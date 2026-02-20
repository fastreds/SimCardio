/**
 * lib/redis.js
 * Cliente Upstash Redis compartido para toda la app Next.js
 * Next.js transpila este archivo automáticamente mediante su bundler.
 */
const { Redis } = require('@upstash/redis');

const KV_KEY = 'simcardio:casos';

// Fallback para desarrollo local sin Redis
function isRedisConfigured() {
    return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis() {
    if (!isRedisConfigured()) return null;
    return new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
}

async function getCasos() {
    const redis = getRedis();
    if (redis) {
        try {
            const data = await redis.get(KV_KEY);
            if (data) return Array.isArray(data) ? data : JSON.parse(data);
        } catch (e) {
            console.error('Redis read error:', e.message);
        }
    }
    return [];
}

async function saveCasos(casos) {
    const redis = getRedis();
    if (redis) {
        await redis.set(KV_KEY, JSON.stringify(casos));
        return true;
    }
    return false;
}

function storageMode() {
    return isRedisConfigured() ? 'upstash-redis' : 'memory';
}

module.exports = { getCasos, saveCasos, storageMode };
