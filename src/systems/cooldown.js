/** In-memory tick cooldowns keyed by stable string IDs or object identity. */
import { system } from '@minecraft/server';
const strings = new Map();
const objects = new WeakMap();
function bucket(owner, create = false) {
    if (typeof owner === 'string') { if (!strings.has(owner) && create) strings.set(owner, new Map()); return strings.get(owner); }
    if (owner && (typeof owner === 'object' || typeof owner === 'function')) {
        let map = objects.get(owner); if (!map && create) { map = new Map(); objects.set(owner, map); } return map;
    }
    throw new TypeError('cooldown owner must be a string or object');
}
function start(owner, key, durationTicks) { const expiresAt = system.currentTick + Math.max(0, durationTicks | 0); bucket(owner, true).set(key, expiresAt); return expiresAt; }
function remaining(owner, key) {
    const map = bucket(owner), expiresAt = map?.get(key);
    if (expiresAt === undefined) return 0;
    const left = expiresAt - system.currentTick;
    if (left <= 0) { map.delete(key); return 0; }
    return left;
}
function has(owner, key) { return remaining(owner, key) > 0; }
function clear(owner, key) { return bucket(owner)?.delete(key) ?? false; }
export const cooldown = { start, has, remaining, clear };
