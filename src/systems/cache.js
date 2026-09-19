/** In-memory cache with tick-based TTL. Undefined is a valid stored value; has() checks key existence. */

import { system } from '@minecraft/server';
const entries = new Map();
let sweepHandle = null;

function ensureSweep() {
    if (sweepHandle) return;
    sweepHandle = system.runInterval(() => {
        const now = system.currentTick;
        for (const [key, entry] of entries) if (entry.expiresAt !== undefined && entry.expiresAt <= now) entries.delete(key);
        if (entries.size === 0) { try { system.clearRun(sweepHandle); } catch {} sweepHandle = null; }
    }, 200);
}

function set(key, value, ttlTicks) {
    ensureSweep();
    const expiresAt = ttlTicks === undefined ? undefined : system.currentTick + Math.max(0, ttlTicks | 0);
    entries.set(key, { value, expiresAt });
    return true;
}
function get(key) {
    const entry = entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== undefined && entry.expiresAt <= system.currentTick) { entries.delete(key); return undefined; }
    return entry.value;
}
function has(key) {
    const entry = entries.get(key);
    if (!entry) return false;
    if (entry.expiresAt !== undefined && entry.expiresAt <= system.currentTick) { entries.delete(key); return false; }
    return true;
}
function del(key) { return entries.delete(key); }
function clear() { entries.clear(); }

export const cache = { get, set, has, delete: del, clear };
