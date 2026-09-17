const grants = new Map();

function ownerId(target) {
    if (typeof target === 'string') return target;
    if (target?.id !== undefined) return String(target.id);
    return String(target);
}

function grant(target, permission) {
    const id = ownerId(target);
    if (!grants.has(id)) grants.set(id, new Set());
    grants.get(id).add(permission);
    return true;
}

function revoke(target, permission) {
    const id = ownerId(target);
    return grants.get(id)?.delete(permission) ?? false;
}

function matches(granted, requested) {
    if (granted === requested) return true;
    if (!granted.endsWith('.*')) return false;
    const prefix = granted.slice(0, -1);
    return requested.startsWith(prefix);
}

function has(target, permission) {
    const id = ownerId(target);
    const set = grants.get(id);
    if (!set) return false;
    if (set.has('*')) return true;
    for (const granted of set) {
        if (matches(granted, permission)) return true;
    }
    return false;
}

function list(target) {
    const id = ownerId(target);
    return Array.from(grants.get(id) ?? []);
}

function clear(target) {
    return grants.delete(ownerId(target));
}

export const permission = { grant, revoke, has, list, clear };
