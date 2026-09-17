import { system } from '@minecraft/server';

const entries = new Map();
let sweepHandle = null;

function ensureSweep() {
    if (sweepHandle) return;
    sweepHandle = system.runInterval(() => {
        const now = system.currentTick;
        for (const [key, entry] of entries) {
            if (entry.expiresAt !== undefined && entry.expiresAt <= now) {
                entries.delete(key);
            }
        }
    }, 200);
}

function set(key, value, ttlTicks) {
    ensureSweep();
    const expiresAt = ttlTicks !== undefined ? system.currentTick + Math.max(0, ttlTicks | 0) : undefined;
    entries.set(key, { value, expiresAt });
    return true;
}

function get(key) {
    const entry = entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== undefined && entry.expiresAt <= system.currentTick) {
        entries.delete(key);
        return undefined;
    }
    return entry.value;
}

function has(key) {
    return get(key) !== undefined;
}

function del(key) {
    return entries.delete(key);
}

function clear() {
    entries.clear();
}

export const cache = { get, set, has, delete: del, clear };
