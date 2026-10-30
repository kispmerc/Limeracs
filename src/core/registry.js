/**
 * Registry with the shape category -> id -> value
 * Used to store objects that other parts of the Library need to look up without creating many global variables.
 */

import { log } from './logger.js';

const registryLog = log.create('registry');
// category -> Map(id, value)
const categories = new Map();

function categoryMap(category) {
    if (!categories.has(category)) categories.set(category, new Map());
    return categories.get(category);
}

function register(category, id, value) {
    const map = categoryMap(category);
    if (map.has(id)) {
        registryLog.warn(`"${id}" already registered in category "${category}", ignoring duplicate`);
        return false;
    }
    map.set(id, value);
    return true;
}

function get(category, id) {
    return categories.get(category)?.get(id);
}

function has(category, id) {
    return categories.get(category)?.has(id) ?? false;
}

function remove(category, id) {
    return categories.get(category)?.delete(id) ?? false;
}

function getAll(category) {
    const map = categories.get(category);
    if (!map) return [];
    return Array.from(map.entries()).map(([id, value]) => ({ id, value }));
}

function clear(category) {
    if (category === undefined) {
        categories.clear();
        return;
    }
    categories.delete(category);
}

function categoryNames() {
    return Array.from(categories.keys());
}

export const registry = { register, get, has, remove, getAll, clear, categoryNames };
