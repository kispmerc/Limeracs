/**
 * Debug facade for inspecting internal Library state without accessing state directly
 * Use inspect() when investigating what modules, registry entries, scheduler tasks, or events are still active.
 */

import { registry } from './registry.js';
import { moduleSystem } from './moduleSystem.js';
import { scheduler } from './scheduler.js';
import { events } from './eventBus.js';
import { log, LogLevel } from './logger.js';

const state = { enabled: false };

function enable() {
    state.enabled = true;
    log.setLevel(LogLevel.DEBUG);
}

function disable() {
    state.enabled = false;
    log.setLevel(LogLevel.INFO);
}

function isEnabled() {
    return state.enabled;
}

function inspectModules() {
    return moduleSystem.list();
}

function inspectRegistry() {
    return registry.categoryNames().map((category) => ({
        category,
        count: registry.getAll(category).length
    }));
}

function inspectScheduler() {
    return { activeTasks: scheduler.activeTaskCount() };
}

function inspectEvents(names) {
    return names.map((name) => ({ name, listeners: events.listenerCount(name) }));
}

export const debugSystem = {
    enable,
    disable,
    isEnabled,
    inspect: {
        modules: inspectModules,
        registry: inspectRegistry,
        scheduler: inspectScheduler,
        events: inspectEvents
    }
};
