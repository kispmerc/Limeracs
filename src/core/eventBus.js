import { log } from './logger.js';

const bus = new Map();
const busLog = log.create('events');

function ensure(name) {
    if (!bus.has(name)) bus.set(name, []);
    return bus.get(name);
}

function on(name, handler, options) {
    if (typeof handler !== 'function') throw new TypeError('handler must be a function');
    const entry = { handler, priority: options?.priority ?? 0, once: false };
    const list = ensure(name);
    list.push(entry);
    list.sort((a, b) => b.priority - a.priority);
    return () => off(name, handler);
}

function once(name, handler, options) {
    if (typeof handler !== 'function') throw new TypeError('handler must be a function');
    const entry = { handler, priority: options?.priority ?? 0, once: true };
    const list = ensure(name);
    list.push(entry);
    list.sort((a, b) => b.priority - a.priority);
    return () => off(name, handler);
}

function off(name, handler) {
    const list = bus.get(name);
    if (!list) return false;
    const index = list.findIndex((entry) => entry.handler === handler);
    if (index === -1) return false;
    list.splice(index, 1);
    return true;
}

function listenerCount(name) {
    return bus.get(name)?.length ?? 0;
}

function emit(name, data) {
    const list = bus.get(name);
    if (!list || list.length === 0) return;
    const snapshot = list.slice();
    for (const entry of snapshot) {
        try {
            entry.handler(data);
        } catch (error) {
            busLog.error(`listener for "${name}" threw:`, error?.message ?? error);
        }
        if (entry.once) off(name, entry.handler);
    }
}

function clear(name) {
    if (name === undefined) {
        bus.clear();
        return;
    }
    bus.delete(name);
}

function namespaced(prefix) {
    const full = (name) => `${prefix}:${name}`;
    return {
        on: (name, handler, options) => on(full(name), handler, options),
        once: (name, handler, options) => once(full(name), handler, options),
        off: (name, handler) => off(full(name), handler),
        emit: (name, data) => emit(full(name), data),
        listenerCount: (name) => listenerCount(full(name))
    };
}

function bridgeAfterEvent(name, source, transform) {
    try {
        source.subscribe((nativeEvent) => {
            emit(name, transform ? transform(nativeEvent) : nativeEvent);
        });
    } catch (error) {
        busLog.warn(`failed to bridge after-event "${name}":`, error?.message ?? error);
    }
}

function bridgeBeforeEvent(name, source, transform) {
    try {
        source.subscribe((nativeEvent) => {
            emit(name, transform ? transform(nativeEvent) : nativeEvent);
        });
    } catch (error) {
        busLog.warn(`failed to bridge before-event "${name}":`, error?.message ?? error);
    }
}

export const events = { on, once, off, emit, listenerCount, clear, namespaced };
export const internal = { bridgeAfterEvent, bridgeBeforeEvent };
