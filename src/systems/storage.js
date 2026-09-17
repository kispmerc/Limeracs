import { world } from '@minecraft/server';
import { log } from '../core/logger.js';

const storageLog = log.create('storage');
const NAMESPACE = 'sundown';

function fullKey(scope, scopeId, key) {
    return `${NAMESPACE}:${scope}:${scopeId}:${key}`;
}

function prefixOf(scope, scopeId) {
    return `${NAMESPACE}:${scope}:${scopeId}:`;
}

function decode(raw) {
    if (raw === undefined) return undefined;
    if (typeof raw !== 'string') return raw;
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

function encode(value) {
    try {
        return JSON.stringify(value);
    } catch (error) {
        storageLog.error('failed to serialize value:', error?.message ?? error);
        return JSON.stringify(null);
    }
}

function createStore(target, scope, scopeId) {
    const prefix = prefixOf(scope, scopeId);

    function get(key, fallback) {
        const raw = target.getDynamicProperty(fullKey(scope, scopeId, key));
        const value = decode(raw);
        return value === undefined ? fallback : value;
    }

    function set(key, value) {
        try {
            target.setDynamicProperty(fullKey(scope, scopeId, key), encode(value));
            return true;
        } catch (error) {
            storageLog.error(`failed to set "${key}":`, error?.message ?? error);
            return false;
        }
    }

    function has(key) {
        return target.getDynamicProperty(fullKey(scope, scopeId, key)) !== undefined;
    }

    function del(key) {
        if (!has(key)) return false;
        target.setDynamicProperty(fullKey(scope, scopeId, key), undefined);
        return true;
    }

    function keys() {
        return target
            .getDynamicPropertyIds()
            .filter((id) => id.startsWith(prefix))
            .map((id) => id.slice(prefix.length));
    }

    function values() {
        return keys().map((key) => get(key));
    }

    function entries() {
        return keys().map((key) => [key, get(key)]);
    }

    function clear() {
        for (const key of keys()) del(key);
    }

    function update(key, updater) {
        const current = get(key);
        const next = updater(current);
        set(key, next);
        return next;
    }

    function increment(key, amount = 1) {
        const current = get(key, 0);
        const next = (typeof current === 'number' ? current : 0) + amount;
        set(key, next);
        return next;
    }

    function decrement(key, amount = 1) {
        return increment(key, -amount);
    }

    return { get, set, has, delete: del, clear, keys, values, entries, increment, decrement, update };
}

const worldStore = createStore(world, 'world', 'global');
const moduleStores = new Map();

function moduleScope(moduleId) {
    if (!moduleStores.has(moduleId)) {
        moduleStores.set(moduleId, createStore(world, 'module', moduleId));
    }
    return moduleStores.get(moduleId);
}

function playerScope(player) {
    return createStore(player, 'player', player.id);
}

export const storage = {
    world: () => worldStore,
    module: moduleScope,
    player: playerScope
};
