/**
 * Persistent key-value storage using Minecraft Dynamic Properties.
 * Logical keys are mapped to compact hashed property identifiers to avoid identifier-length issues.
 * A small per-store index maps physical keys back to logical keys for keys()/entries()/clear().
 */

import { world } from '@minecraft/server';
import { log } from '../core/logger.js';

const storageLog = log.create('storage');
const NAMESPACE = 'limeracs';
const INDEX_PREFIX = `${NAMESPACE}_i_`;
const KEY_PREFIX = `${NAMESPACE}_k_`;
const LEGACY_NAMESPACE = 'sundown';

function hash(value) {
    let a = 0x811c9dc5, b = 0x01000193;
    for (let i = 0; i < value.length; i += 1) {
        const c = value.charCodeAt(i);
        a ^= c; a = Math.imul(a, 0x01000193);
        b ^= c + i; b = Math.imul(b, 0x85ebca6b);
    }
    return `${(a >>> 0).toString(16).padStart(8, '0')}${(b >>> 0).toString(16).padStart(8, '0')}`;
}

function physicalKey(scope, scopeId, key) {
    return `${KEY_PREFIX}${hash(`${scope}\0${scopeId}\0${key}`)}`;
}
function legacyKey(scope, scopeId, key) {
    return `${LEGACY_NAMESPACE}:${scope}:${scopeId}:${key}`;
}
function legacyPrefix(scope, scopeId) {
    return `${LEGACY_NAMESPACE}:${scope}:${scopeId}:`;
}

function indexKey(scope, scopeId) {
    return `${INDEX_PREFIX}${hash(`${scope}\0${scopeId}`)}`;
}

function readIndex(target, scope, scopeId) {
    try {
        const raw = target.getDynamicProperty(indexKey(scope, scopeId));
        if (raw === undefined) return [];
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed.filter((entry) => Array.isArray(entry) && entry.length === 2) : [];
    } catch (error) {
        storageLog.warn(`failed to read index for ${scope}:${scopeId}:`, error?.message ?? error);
        return [];
    }
}

function writeIndex(target, scope, scopeId, entries) {
    try {
        target.setDynamicProperty(indexKey(scope, scopeId), JSON.stringify(entries));
        return true;
    } catch (error) {
        storageLog.error(`failed to write index for ${scope}:${scopeId}:`, error?.message ?? error);
        return false;
    }
}

function encode(value) {
    try {
        const encoded = JSON.stringify(value);
        if (encoded === undefined) return { ok: false, error: new TypeError('undefined cannot be persisted') };
        return { ok: true, value: encoded };
    } catch (error) {
        return { ok: false, error };
    }
}

function decode(raw) {
    if (raw === undefined) return undefined;
    if (typeof raw !== 'string') return raw;
    try { return JSON.parse(raw); } catch { return raw; }
}

function createStore(target, scope, scopeId) {
    function entriesIndex() { return readIndex(target, scope, scopeId); }
    function findEntry(key) { return entriesIndex().find((entry) => entry[0] === key); }

    function get(key, fallback) {
        let raw = target.getDynamicProperty(physicalKey(scope, scopeId, key));
        if (raw === undefined) raw = target.getDynamicProperty(legacyKey(scope, scopeId, key));
        const value = decode(raw);
        return value === undefined ? fallback : value;
    }

    function set(key, value) {
        const encoded = encode(value);
        if (!encoded.ok) {
            storageLog.error(`failed to serialize "${key}":`, encoded.error?.message ?? encoded.error);
            return false;
        }
        const propertyKey = physicalKey(scope, scopeId, key);
        try {
            target.setDynamicProperty(propertyKey, encoded.value);
        } catch (error) {
            storageLog.error(`failed to set "${key}":`, error?.message ?? error);
            return false;
        }
        const entries = entriesIndex();
        if (!entries.some((entry) => entry[0] === key)) {
            entries.push([key, propertyKey]);
            if (!writeIndex(target, scope, scopeId, entries)) {
                try { target.setDynamicProperty(propertyKey, undefined); } catch { /* best effort rollback */ }
                return false;
            }
        }
        return true;
    }

    function has(key) {
        return target.getDynamicProperty(physicalKey(scope, scopeId, key)) !== undefined
            || target.getDynamicProperty(legacyKey(scope, scopeId, key)) !== undefined;
    }

    function del(key) {
        if (!has(key)) return false;
        try {
            target.setDynamicProperty(physicalKey(scope, scopeId, key), undefined);
            target.setDynamicProperty(legacyKey(scope, scopeId, key), undefined);
        } catch (error) { storageLog.error(`failed to delete "${key}":`, error?.message ?? error); return false; }
        const entries = entriesIndex().filter((entry) => entry[0] !== key);
        writeIndex(target, scope, scopeId, entries);
        return true;
    }

    function keys() {
        const indexed = entriesIndex().map(([key]) => key);
        let legacy = [];
        try { legacy = target.getDynamicPropertyIds().filter((id) => id.startsWith(legacyPrefix(scope, scopeId))).map((id) => id.slice(legacyPrefix(scope, scopeId).length)); } catch {}
        return [...new Set([...indexed, ...legacy])].filter((key) => has(key));
    }
    function values() { return keys().map((key) => get(key)); }
    function entries() { return keys().map((key) => [key, get(key)]); }

    function clear() {
        for (const key of keys()) del(key);
        try { target.setDynamicProperty(indexKey(scope, scopeId), undefined); } catch { /* best effort */ }
    }

    function update(key, updater) {
        if (typeof updater !== 'function') throw new TypeError('updater must be a function');
        const current = get(key);
        const next = updater(current);
        return set(key, next) ? next : current;
    }

    function increment(key, amount = 1) {
        const current = get(key, 0);
        const next = (typeof current === 'number' ? current : 0) + amount;
        return set(key, next) ? next : current;
    }

    function decrement(key, amount = 1) { return increment(key, -amount); }

    return { get, set, has, delete: del, clear, keys, values, entries, increment, decrement, update };
}

const worldStore = createStore(world, 'world', 'global');
const moduleStores = new Map();
function moduleScope(moduleId) {
    if (!moduleStores.has(moduleId)) moduleStores.set(moduleId, createStore(world, 'module', moduleId));
    return moduleStores.get(moduleId);
}
function playerScope(player) {
    if (!player?.id) throw new TypeError('player with a stable id is required');
    return createStore(player, 'player', player.id);
}

export const storage = { world: () => worldStore, module: moduleScope, player: playerScope };
