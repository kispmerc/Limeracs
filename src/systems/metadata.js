/**
 * Temporary metadata attached to objects/entities/players by ID
 * Unlike storage, this data only lives in memory and is not persistent.
 */

const store = new Map();

function targetId(target) {
    if (typeof target === 'string') return target;
    if (target?.id !== undefined) return String(target.id);
    return String(target);
}

function get(target, key) {
    return store.get(targetId(target))?.get(key);
}

function set(target, key, value) {
    const id = targetId(target);
    if (!store.has(id)) store.set(id, new Map());
    store.get(id).set(key, value);
    return true;
}

function has(target, key) {
    return store.get(targetId(target))?.has(key) ?? false;
}

function del(target, key) {
    return store.get(targetId(target))?.delete(key) ?? false;
}

function clear(target) {
    return store.delete(targetId(target));
}

export const metadata = { get, set, has, delete: del, clear };
