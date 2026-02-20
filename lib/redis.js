/**
 * lib/redis.js — Upstash REST API via fetch nativo
 * Fallback a casos.js local si Redis no está disponible.
 */
import { existsSync, readFileSync } from 'fs';
import { createRequire } from 'module';

const KV_KEY = 'simcardio:casos';

function getCredentials() {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    return { url, token, ok: !!(url && token) };
}

async function upstash(command) {
    const { url, token } = getCredentials();
    const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP ${res.status}`);
    }
    return json.result;
}

// ── Fallback: lee casos.js local (solo en dev) ───────────
function loadLocalCasos() {
    try {
        // En Next.js, process.cwd() es la raíz del proyecto
        const path = `${process.cwd()}/casos.js`;
        if (!existsSync(path)) return [];
        const content = readFileSync(path, 'utf8');
        const arrayStr = content.replace(/^\s*const\s+casos\s*=\s*/m, '').replace(/;?\s*$/, '').trim();
        return new Function(`return ${arrayStr}`)();
    } catch (e) {
        console.warn('[redis] loadLocalCasos fallback failed:', e.message);
        return [];
    }
}

// ── Public API ───────────────────────────────────────────
export async function getCasos() {
    const { ok } = getCredentials();
    if (!ok) {
        console.warn('[redis] No credentials — using local casos.js');
        return loadLocalCasos();
    }
    try {
        const result = await upstash(['GET', KV_KEY]);
        if (!result) {
            // Redis key is null — auto-seed from local file
            const local = loadLocalCasos();
            if (local.length > 0) {
                console.log(`[redis] Auto-seeding ${local.length} casos from casos.js`);
                await saveCasos(local);
                return local;
            }
            return [];
        }
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('[redis] getCasos error:', e.message);
        // Fallback to local file on error
        return loadLocalCasos();
    }
}

export async function saveCasos(casos) {
    const { ok } = getCredentials();
    if (!ok) {
        console.warn('[redis] No credentials — save skipped');
        return false;
    }
    try {
        await upstash(['SET', KV_KEY, JSON.stringify(casos)]);
        console.log(`[redis] Saved ${casos.length} casos`);
        return true;
    } catch (e) {
        console.error('[redis] saveCasos error:', e.message);
        throw new Error(`Redis write failed: ${e.message}`);
    }
}

export function storageMode() {
    const { ok } = getCredentials();
    return ok ? 'upstash-redis' : 'local-fallback';
}
