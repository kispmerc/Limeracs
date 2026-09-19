/** In-memory permissions with exact and trailing-namespace wildcards. */

const ids = new Map();
const objects = new WeakMap();
function ownerSet(target, create = false) {
    if (typeof target === 'string') {
        if (!ids.has(target) && create) ids.set(target, new Set());
        return ids.get(target);
    }
    if (target && (typeof target === 'object' || typeof target === 'function')) {
        let set = objects.get(target);
        if (!set && create) { set = new Set(); objects.set(target, set); }
        return set;
    }
    throw new TypeError('permission target must be a string or object');
}
function grant(target, permission) { ownerSet(target, true).add(permission); return true; }
function revoke(target, permission) { return ownerSet(target)?.delete(permission) ?? false; }
function matches(granted, requested) {
    if (granted === requested || granted === '*') return true;
    return granted.endsWith('.*') && requested.startsWith(granted.slice(0, -1));
}
function has(target, permission) { for (const granted of ownerSet(target) ?? []) if (matches(granted, permission)) return true; return false; }
function list(target) { return [...(ownerSet(target) ?? [])]; }
function clear(target) { return typeof target === 'string' ? ids.delete(target) : objects.delete(target); }
export const permission = { grant, revoke, has, list, clear };
