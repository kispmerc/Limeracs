/** In-memory cache with tick-based TTL. Undefined is a valid stored value; has() checks key existence. */

import { system } from '@minecraft/server';
const entries = new Map();
let sweepHandle = null;

function hasExpiringEntries() {
    for (const entry of entries.values()) if (entry.expiresAt !== undefined) return true;
    return false;
}

function stopSweepIfIdle() {
    if (sweepHandle === null || hasExpiringEntries()) return;
    try { system.clearRun(sweepHandle); } catch { /* already stopped */ }
    sweepHandle = null;
}

function ensureSweep() {
    if (sweepHandle) return;
    sweepHandle = system.runInterval(() => {
        const now = system.currentTick;
        for (const [key, entry] of entries) if (entry.expiresAt !== undefined && entry.expiresAt <= now) entries.delete(key);
        stopSweepIfIdle();
    }, 200);
}

function set(key, value, ttlTicks) {
    if (ttlTicks !== undefined && !Number.isFinite(ttlTicks)) throw new TypeError('ttlTicks must be a finite number');
    const expiresAt = ttlTicks === undefined ? undefined : system.currentTick + Math.max(0, Math.trunc(ttlTicks));
    entries.set(key, { value, expiresAt });
    if (expiresAt !== undefined) ensureSweep();
    else stopSweepIfIdle();
    return true;
}
function get(key) {
    const entry = entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== undefined && entry.expiresAt <= system.currentTick) { entries.delete(key); stopSweepIfIdle(); return undefined; }
    return entry.value;
}
function has(key) {
    const entry = entries.get(key);
    if (!entry) return false;
    if (entry.expiresAt !== undefined && entry.expiresAt <= system.currentTick) { entries.delete(key); stopSweepIfIdle(); return false; }
    return true;
}
function del(key) { const deleted = entries.delete(key); stopSweepIfIdle(); return deleted; }
function clear() { entries.clear(); stopSweepIfIdle(); }

export const cache = { get, set, has, delete: del, clear };
