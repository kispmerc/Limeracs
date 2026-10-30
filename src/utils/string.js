/** String helpers that are not tied to the Minecraft API */

function capitalize(value) {
    if (typeof value !== 'string' || value.length === 0) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function truncate(value, maxLength, suffix = '...') {
    if (typeof value !== 'string' || value.length <= maxLength) return value;
    return value.slice(0, Math.max(0, maxLength - suffix.length)) + suffix;
}

function isBlank(value) {
    return typeof value !== 'string' || value.trim().length === 0;
}

function safeFormat(template, values) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match;
    });
}

export const stringUtils = { capitalize, truncate, isBlank, safeFormat };
