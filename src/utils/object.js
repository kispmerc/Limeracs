function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function merge(target, source) {
    return { ...target, ...source };
}

function pick(source, keys) {
    const result = {};
    for (const key of keys) {
        if (key in source) result[key] = source[key];
    }
    return result;
}

function omit(source, keys) {
    const excluded = new Set(keys);
    const result = {};
    for (const key of Object.keys(source)) {
        if (!excluded.has(key)) result[key] = source[key];
    }
    return result;
}

export const objectUtils = { clone, merge, pick, omit };
