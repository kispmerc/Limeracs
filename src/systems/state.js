/**
 * Global transient state with the shape namespace -> key -> value
 * Use this for runtime state; do not use it instead of storage when data must survive restarts.
 */

const namespaces = new Map();

function namespace(name) {
    if (!namespaces.has(name)) namespaces.set(name, new Map());
    return namespaces.get(name);
}

function get(ns, key) {
    return namespace(ns).get(key);
}

function set(ns, key, value) {
    namespace(ns).set(key, value);
    return true;
}

function has(ns, key) {
    return namespace(ns).has(key);
}

function del(ns, key) {
    return namespace(ns).delete(key);
}

function clear(ns) {
    if (ns === undefined) {
        namespaces.clear();
        return true;
    }
    return namespaces.delete(ns);
}

export const state = { get, set, has, delete: del, clear };
