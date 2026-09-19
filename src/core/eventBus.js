/**
 * Framework event bus. Native Minecraft events are bridged here so consumers can
 * subscribe without importing @minecraft/server for every event.
 */

import { log } from './logger.js';

const bus = new Map();
const busLog = log.create('events');

function ensure(name) {
    if (!bus.has(name)) bus.set(name, []);
    return bus.get(name);
}

function add(name, handler, options = {}, once = false) {
    if (typeof handler !== 'function') throw new TypeError('handler must be a function');
    const entry = { handler, priority: options.priority ?? 0, once };
    const list = ensure(name);
    list.push(entry);
    list.sort((a, b) => b.priority - a.priority);
    return () => off(name, handler);
}

function on(name, handler, options) { return add(name, handler, options, false); }
function once(name, handler, options) { return add(name, handler, options, true); }

function off(name, handler) {
    const list = bus.get(name);
    if (!list) return false;
    const index = list.findIndex((entry) => entry.handler === handler);
    if (index < 0) return false;
    list.splice(index, 1);
    if (list.length === 0) bus.delete(name);
    return true;
}

function listenerCount(name) { return bus.get(name)?.length ?? 0; }

function emit(name, data) {
    const list = bus.get(name);
    if (!list?.length) return 0;
    const snapshot = list.slice();
    let invoked = 0;
    for (const entry of snapshot) {
        if (!bus.get(name)?.includes(entry)) continue;
        try {
            entry.handler(data);
            invoked += 1;
        } catch (error) {
            busLog.error(`listener for "${name}" threw:`, error?.message ?? error);
        }
        if (entry.once) off(name, entry.handler);
    }
    return invoked;
}

async function emitAsync(name, data) {
    const list = bus.get(name);
    if (!list?.length) return 0;
    const snapshot = list.slice();
    let invoked = 0;
    for (const entry of snapshot) {
        if (!bus.get(name)?.includes(entry)) continue;
        try {
            await entry.handler(data);
            invoked += 1;
        } catch (error) {
            busLog.error(`async listener for "${name}" threw:`, error?.message ?? error);
        }
        if (entry.once) off(name, entry.handler);
    }
    return invoked;
}

function clear(name) {
    if (name === undefined) bus.clear();
    else bus.delete(name);
}

function namespaced(prefix) {
    const full = (name) => `${prefix}:${name}`;
    return {
        on: (name, handler, options) => on(full(name), handler, options),
        once: (name, handler, options) => once(full(name), handler, options),
        off: (name, handler) => off(full(name), handler),
        emit: (name, data) => emit(full(name), data),
        emitAsync: (name, data) => emitAsync(full(name), data),
        listenerCount: (name) => listenerCount(full(name))
    };
}

function bridgeAfterEvent(name, source, transform) {
    try {
        if (!source?.subscribe) throw new Error('event source is unavailable');
        source.subscribe((nativeEvent) => emit(name, transform ? transform(nativeEvent) : nativeEvent));
        return true;
    } catch (error) {
        busLog.warn(`failed to bridge after-event "${name}":`, error?.message ?? error);
        return false;
    }
}

function bridgeBeforeEvent(name, source, transform) {
    try {
        if (!source?.subscribe) throw new Error('event source is unavailable');
        source.subscribe((nativeEvent) => emit(name, transform ? transform(nativeEvent) : nativeEvent));
        return true;
    } catch (error) {
        busLog.warn(`failed to bridge before-event "${name}":`, error?.message ?? error);
        return false;
    }
}

export const events = { on, once, off, emit, emitAsync, listenerCount, clear, namespaced };
export const internal = { bridgeAfterEvent, bridgeBeforeEvent };
