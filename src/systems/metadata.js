/** In-memory metadata attached to stable IDs, with WeakMap support for object targets without IDs. */

const ids = new Map();
const objects = new WeakMap();

function bucket(target, create = false) {
    if (typeof target === 'string') {
        if (!ids.has(target) && create) ids.set(target, new Map());
        return ids.get(target);
    }
    if (target && (typeof target === 'object' || typeof target === 'function')) {
        let map = objects.get(target);
        if (!map && create) { map = new Map(); objects.set(target, map); }
        return map;
    }
    throw new TypeError('metadata target must be a string or object');
}
function get(target, key) { return bucket(target)?.get(key); }
function set(target, key, value) { bucket(target, true).set(key, value); return true; }
function has(target, key) { return bucket(target)?.has(key) ?? false; }
function del(target, key) { return bucket(target)?.delete(key) ?? false; }
function clear(target) { return typeof target === 'string' ? ids.delete(target) : objects.delete(target); }

export const metadata = { get, set, has, delete: del, clear };
