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

function isValidSpec(spec, ancestors = new Set()) {
    if (typeof spec === 'string') return Object.prototype.hasOwnProperty.call(primitive, spec);
    if (typeof spec === 'function') return true;
    if (!spec || typeof spec !== 'object' || Array.isArray(spec) || ancestors.has(spec)) return false;
    ancestors.add(spec);
    const validType = spec.type === undefined || Object.prototype.hasOwnProperty.call(primitive, spec.type);
    const validFunction = spec.validate === undefined || typeof spec.validate === 'function';
    const validEnum = spec.enum === undefined || Array.isArray(spec.enum);
    const validBounds = ['min', 'max'].every((key) => spec[key] === undefined || Number.isFinite(spec[key]))
        && ['minLength', 'maxLength'].every((key) => spec[key] === undefined
            || (Number.isInteger(spec[key]) && spec[key] >= 0))
        && (spec.min === undefined || spec.max === undefined || spec.min <= spec.max)
        && (spec.minLength === undefined || spec.maxLength === undefined || spec.minLength <= spec.maxLength);
    const validFlags = ['nullable', 'optional', 'integer'].every((key) => spec[key] === undefined || typeof spec[key] === 'boolean');
    const validNesting = (spec.items === undefined || spec.type === 'array')
        && (spec.shape === undefined || spec.type === undefined || spec.type === 'object');
    const validItems = spec.items === undefined || isValidSpec(spec.items, ancestors);
    const validShape = spec.shape === undefined || (!!spec.shape && typeof spec.shape === 'object'
        && !Array.isArray(spec.shape) && Object.values(spec.shape).every((child) => isValidSpec(child, ancestors)));
    ancestors.delete(spec);
    return validType && validFunction && validEnum && validBounds && validFlags && validNesting && validItems && validShape;
}

function checkSpec(spec, value, path, errors) {
    const s = normalize(spec);
    if (value === null && s.nullable) return;
    if (value === undefined && s.optional) return;
    if (value === undefined) { errors.push(`missing field "${path}"`); return; }
    if (s.validate) {
        try {
            if (!s.validate(value)) { errors.push(`field "${path}" failed validation`); return; }
        } catch {
            errors.push(`validator for field "${path}" threw`);
            return;
        }
    }
    if (s.type && !primitive[s.type]?.(value)) { errors.push(`field "${path}" expected ${s.type}`); return; }
    if (s.shape && !primitive.object(value)) { errors.push(`field "${path}" expected object`); return; }
    if (s.type === 'array' && s.items) value.forEach((v, i) => checkSpec(s.items, v, `${path}[${i}]`, errors));
    if ((s.type === 'object' || s.shape) && s.shape) for (const [key, child] of Object.entries(s.shape)) checkSpec(child, value[key], `${path}.${key}`, errors);
    if (typeof value === 'string') { if (s.minLength !== undefined && value.length < s.minLength) errors.push(`field "${path}" is shorter than ${s.minLength}`); if (s.maxLength !== undefined && value.length > s.maxLength) errors.push(`field "${path}" is longer than ${s.maxLength}`); }
    if (typeof value === 'number') { if (s.min !== undefined && value < s.min) errors.push(`field "${path}" is below ${s.min}`); if (s.max !== undefined && value > s.max) errors.push(`field "${path}" is above ${s.max}`); if (s.integer && !Number.isInteger(value)) errors.push(`field "${path}" must be an integer`); }
    if (s.enum && !s.enum.includes(value)) errors.push(`field "${path}" is not an allowed value`);
}
function define(name, shape, options = {}) {
    if (typeof name !== 'string' || !name || schemas.has(name)
        || !shape || typeof shape !== 'object' || Array.isArray(shape)
        || !Object.values(shape).every((spec) => isValidSpec(spec))
        || !options || typeof options !== 'object' || Array.isArray(options)
        || (options.defaults !== undefined && (!options.defaults || typeof options.defaults !== 'object' || Array.isArray(options.defaults)))) {
        return false;
    }
    schemas.set(name, { shape, version: options.version ?? 1, defaults: options.defaults ?? {} });
    return true;
}
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
