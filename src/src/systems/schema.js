/**
 * Runtime schema validation for primitive/container data
 * Schemas work well with storage/config because they validate shape and fill defaults before data is used.
 */

const schemas = new Map();

// Data types are limited to simple primitives/containers so the validator remains predictable.
const PRIMITIVE_CHECKS = {
    string: (v) => typeof v === 'string',
    number: (v) => typeof v === 'number' && Number.isFinite(v),
    boolean: (v) => typeof v === 'boolean',
    object: (v) => typeof v === 'object' && v !== null && !Array.isArray(v),
    array: (v) => Array.isArray(v)
};

function define(name, shape, options) {
    schemas.set(name, { shape, version: options?.version ?? 1, defaults: options?.defaults ?? {} });
    return true;
}

function get(name) {
    return schemas.get(name);
}

function has(name) {
    return schemas.has(name);
}

// validate returns both a boolean and an error list so callers can display or debug detailed failures.
function validate(name, data) {
    const schema = schemas.get(name);
    if (!schema) return { valid: false, errors: [`schema "${name}" not defined`] };
    const errors = [];
    for (const [field, type] of Object.entries(schema.shape)) {
        const check = PRIMITIVE_CHECKS[type];
        if (!check) {
            errors.push(`unknown type "${type}" for field "${field}"`);
            continue;
        }
        const value = data?.[field];
        if (value === undefined) {
            if (!(field in (schema.defaults ?? {}))) {
                errors.push(`missing field "${field}"`);
            }
            continue;
        }
        if (!check(value)) {
            errors.push(`field "${field}" expected ${type}`);
        }
    }
    return { valid: errors.length === 0, errors };
}

function applyDefaults(name, data) {
    const schema = schemas.get(name);
    if (!schema) return data;
    const result = { ...schema.defaults, ...data };
    return result;
}

function versionOf(name) {
    return schemas.get(name)?.version;
}

export const schema = { define, get, has, validate, applyDefaults, versionOf };
