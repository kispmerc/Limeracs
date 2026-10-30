/**
 * Namespace-based runtime configuration
 * create() keeps the default values as the original source so reset() can restore them.
 */

const configs = new Map();

function create(namespace, defaults) {
    if (configs.has(namespace)) {
        return configs.get(namespace).proxy;
    }
    const values = Object.assign(Object.create(null), defaults);
    const original = Object.assign(Object.create(null), defaults);
    const proxy = {
        get(key) {
            return values[key];
        },
        set(key, value) {
            values[key] = value;
            return true;
        },
        has(key) {
            return Object.prototype.hasOwnProperty.call(values, key);
        },
        reset(key) {
            if (key === undefined) {
                for (const k of Object.keys(values)) delete values[k];
                Object.assign(values, original);
                return true;
            }
            if (!Object.prototype.hasOwnProperty.call(original, key)) return false;
            values[key] = original[key];
            return true;
        },
        getAll() {
            return { ...values };
        }
    };
    configs.set(namespace, { proxy, values });
    return proxy;
}

function get(namespace) {
    return configs.get(namespace)?.proxy;
}

function has(namespace) {
    return configs.has(namespace);
}

export const config = { create, get, has };
