/** Small runtime schema validator for primitives, arrays, nested shapes, defaults, optional and nullable fields. */
const schemas = new Map();
const primitive = {
    string: (v) => typeof v === 'string', number: (v) => typeof v === 'number' && Number.isFinite(v),
    boolean: (v) => typeof v === 'boolean', object: (v) => v !== null && typeof v === 'object' && !Array.isArray(v), array: Array.isArray
};
function normalize(spec) {
    if (typeof spec === 'string') return { type: spec };
    if (typeof spec === 'function') return { validate: spec };
    if (spec && typeof spec === 'object') return spec;
    throw new TypeError('invalid schema field');
}
function checkSpec(spec, value, path, errors) {
    const s = normalize(spec);
    if (value === null && s.nullable) return;
    if (value === undefined && s.optional) return;
    if (value === undefined) { errors.push(`missing field "${path}"`); return; }
    if (s.validate && !s.validate(value)) { errors.push(`field "${path}" failed validation`); return; }
    if (s.type && !primitive[s.type]?.(value)) { errors.push(`field "${path}" expected ${s.type}`); return; }
    if (s.type === 'array' && s.items) value.forEach((v, i) => checkSpec(s.items, v, `${path}[${i}]`, errors));
    if ((s.type === 'object' || s.shape) && s.shape) for (const [key, child] of Object.entries(s.shape)) checkSpec(child, value[key], `${path}.${key}`, errors);
    if (typeof value === 'string') { if (s.minLength !== undefined && value.length < s.minLength) errors.push(`field "${path}" is shorter than ${s.minLength}`); if (s.maxLength !== undefined && value.length > s.maxLength) errors.push(`field "${path}" is longer than ${s.maxLength}`); }
    if (typeof value === 'number') { if (s.min !== undefined && value < s.min) errors.push(`field "${path}" is below ${s.min}`); if (s.max !== undefined && value > s.max) errors.push(`field "${path}" is above ${s.max}`); if (s.integer && !Number.isInteger(value)) errors.push(`field "${path}" must be an integer`); }
    if (s.enum && !s.enum.includes(value)) errors.push(`field "${path}" is not an allowed value`);
}
function define(name, shape, options = {}) { schemas.set(name, { shape, version: options.version ?? 1, defaults: options.defaults ?? {} }); return true; }
function get(name) { return schemas.get(name); }
function has(name) { return schemas.has(name); }
function validate(name, data) {
    const schema = schemas.get(name); if (!schema) return { valid: false, errors: [`schema "${name}" not defined`] };
    const errors = []; for (const [field, spec] of Object.entries(schema.shape)) checkSpec(spec, data?.[field], field, errors);
    return { valid: errors.length === 0, errors };
}
function applyDefaults(name, data) { const schema = schemas.get(name); return schema ? { ...schema.defaults, ...data } : data; }
function versionOf(name) { return schemas.get(name)?.version; }
export const schema = { define, get, has, validate, applyDefaults, versionOf };
