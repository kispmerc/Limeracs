/**
 * Limeracs module system.
 * Modules are dependency-sorted before initialization/startup and stopped in reverse order.
 * Module contexts can own event listeners, scheduled tasks, and cleanup callbacks.
 */

import { log } from './logger.js';
import { semver } from '../data/semver.js';
import { events } from './eventBus.js';
import { scheduler } from './scheduler.js';
import { registry } from './registry.js';

const moduleLog = log.create('module');
const ModuleState = Object.freeze({
    REGISTERED: 'REGISTERED', INITIALIZED: 'INITIALIZED', STARTED: 'STARTED', STOPPED: 'STOPPED', FAILED: 'FAILED'
});
const modules = new Map();
const versions = new Map();

function setLibVersion(id, version) { versions.set(id, version); }
function resolveVersion(id) { return versions.get(id) ?? modules.get(id)?.definition.version; }

function validateDependencies(definition) {
    const missing = [];
    for (const [depId, range] of Object.entries(definition.dependencies ?? {})) {
        const depVersion = resolveVersion(depId);
        if (depVersion === undefined) missing.push(`${depId} (not registered)`);
        else if (!semver.satisfies(depVersion, range)) missing.push(`${depId}@${range} (found ${depVersion})`);
    }
    return { ok: missing.length === 0, missing };
}

function createContext(id, base = {}) {
    const owner = `module:${id}`;
    const cleanups = new Set();
    const own = (cleanup) => {
        if (typeof cleanup !== 'function') throw new TypeError('cleanup must be a function');
        cleanups.add(cleanup);
        return () => cleanups.delete(cleanup);
    };
    const context = {
        ...base,
        registry: base.registry ?? registry,
        moduleId: id,
        own,
        on(name, handler, options) {
            const off = events.on(name, handler, options);
            own(off);
            return off;
        },
        once(name, handler, options) {
            const off = events.once(name, handler, options);
            own(off);
            return off;
        },
        register(category, resourceId, value) {
            const registryApi = base.registry ?? registry;
            if (!registryApi?.register) throw new Error('registry is not available in this module context');
            if (!registryApi.register(category, resourceId, value)) return false;
            own(() => registryApi.remove(category, resourceId));
            return true;
        },
        schedule: {
            nextTick(callback) { const h = scheduler.nextTick(callback, owner); own(() => h.cancel()); return h; },
            delay(callback, ticks) { const h = scheduler.delay(callback, ticks, owner); own(() => h.cancel()); return h; },
            repeat(callback, ticks) { const h = scheduler.repeat(callback, ticks, owner); own(() => h.cancel()); return h; },
            afterSeconds(callback, seconds) { const h = scheduler.afterSeconds(callback, seconds, owner); own(() => h.cancel()); return h; },
            everySeconds(callback, seconds) { const h = scheduler.everySeconds(callback, seconds, owner); own(() => h.cancel()); return h; }
        }
    };
    return { context, cleanup() {
        for (const cleanup of [...cleanups].reverse()) {
            try { cleanup(); } catch (error) { moduleLog.warn(`cleanup for "${id}" threw:`, error?.message ?? error); }
        }
        cleanups.clear();
        scheduler.cancelOwner(owner);
    }};
}

function register(definition) {
    if (!definition || typeof definition.id !== 'string' || !definition.id) {
        moduleLog.error('module registration rejected: missing id'); return false;
    }
    if (modules.has(definition.id)) { moduleLog.warn(`module "${definition.id}" already registered, ignoring duplicate`); return false; }
    if (definition.version !== undefined && !semver.isValid(definition.version)) {
        moduleLog.error(`module "${definition.id}" has invalid version "${definition.version}"`); return false;
    }
    if (definition.dependencies && typeof definition.dependencies !== 'object') {
        moduleLog.error(`module "${definition.id}" dependencies must be an object`); return false;
    }
    modules.set(definition.id, { definition, state: ModuleState.REGISTERED, context: {}, cleanup: null });
    return true;
}

function unregister(id) {
    const record = modules.get(id);
    if (!record) return false;
    for (const [otherId, other] of modules) {
        if (otherId !== id && Object.prototype.hasOwnProperty.call(other.definition.dependencies ?? {}, id)) {
            moduleLog.warn(`cannot unregister \"${id}\" while module \"${otherId}\" depends on it`);
            return false;
        }
    }
    if (record.state === ModuleState.STARTED) stop(id);
    if (record.state === ModuleState.INITIALIZED) cleanupRecord(record);
    modules.delete(id);
    return true;
}

function cleanupRecord(record) {
    record.cleanup?.();
    record.cleanup = null;
    record.context = {};
}

function get(id) { return modules.get(id)?.definition; }
function has(id) { return modules.has(id); }
function list() { return [...modules.entries()].map(([id, r]) => ({ id, version: r.definition.version, state: r.state })); }
function stateOf(id) { return modules.get(id)?.state; }

function dependencyOrder() {
    const visiting = new Set();
    const visited = new Set();
    const order = [];

    function visit(id, chain = []) {
        if (visited.has(id)) return true;
        if (visiting.has(id)) {
            const cycleStart = chain.indexOf(id);
            const cycle = [...chain.slice(cycleStart), id];
            throw new Error(`circular dependency: ${cycle.join(' -> ')}`);
        }
        const record = modules.get(id);
        if (!record) return false;
        visiting.add(id);
        for (const depId of Object.keys(record.definition.dependencies ?? {})) {
            if (modules.has(depId)) {
                if (!visit(depId, [...chain, id])) return false;
            }
        }
        visiting.delete(id);
        visited.add(id);
        order.push(id);
        return true;
    }

    for (const id of modules.keys()) visit(id);
    return order;
}

function init(id, baseContext) {
    const record = modules.get(id);
    if (!record || record.state !== ModuleState.REGISTERED) return false;
    for (const depId of Object.keys(record.definition.dependencies ?? {})) {
        if (modules.has(depId) && ![ModuleState.INITIALIZED, ModuleState.STARTED].includes(modules.get(depId).state)) {
            moduleLog.error(`"${id}" cannot initialize because dependency "${depId}" is not initialized`);
            record.state = ModuleState.FAILED;
            return false;
        }
    }
    const check = validateDependencies(record.definition);
    if (!check.ok) {
        moduleLog.error(`"${id}" cannot initialize: ${check.missing.join(', ')}`);
        record.state = ModuleState.FAILED;
        return false;
    }
    const resourceContext = createContext(id, baseContext);
    record.context = resourceContext.context;
    record.cleanup = resourceContext.cleanup;
    try {
        record.definition.init?.(record.context);
        record.state = ModuleState.INITIALIZED;
        return true;
    } catch (error) {
        moduleLog.error(`"${id}" init() threw:`, error?.message ?? error);
        record.state = ModuleState.FAILED;
        cleanupRecord(record);
        return false;
    }
}

function start(id) {
    const record = modules.get(id);
    if (!record || record.state !== ModuleState.INITIALIZED) return false;
    for (const depId of Object.keys(record.definition.dependencies ?? {})) {
        if (modules.has(depId) && modules.get(depId).state !== ModuleState.STARTED) {
            moduleLog.error(`"${id}" cannot start because dependency "${depId}" is not STARTED`);
            record.state = ModuleState.FAILED;
            cleanupRecord(record);
            return false;
        }
    }
    try {
        record.definition.start?.(record.context);
        record.state = ModuleState.STARTED;
        events.emit('limeracs:module:started', { id });
        return true;
    } catch (error) {
        moduleLog.error(`"${id}" start() threw:`, error?.message ?? error);
        record.state = ModuleState.FAILED;
        cleanupRecord(record);
        return false;
    }
}

function stop(id) {
    const record = modules.get(id);
    if (!record || record.state !== ModuleState.STARTED) return false;
    try { record.definition.stop?.(record.context); }
    catch (error) { moduleLog.error(`"${id}" stop() threw:`, error?.message ?? error); }
    cleanupRecord(record);
    record.state = ModuleState.STOPPED;
    events.emit('limeracs:module:stopped', { id });
    return true;
}

function bootAll(context) {
    let order;
    try { order = dependencyOrder(); }
    catch (error) {
        moduleLog.error(error?.message ?? error);
        for (const record of modules.values()) record.state = ModuleState.FAILED;
        return false;
    }
    let ok = true;
    for (const id of order) if (!init(id, context)) ok = false;
    for (const id of order) {
        const record = modules.get(id);
        if (record?.state === ModuleState.INITIALIZED && !start(id)) ok = false;
    }
    return ok;
}

function stopAll() {
    let order;
    try { order = dependencyOrder().reverse(); } catch { order = [...modules.keys()].reverse(); }
    let stopped = 0;
    for (const id of order) if (stop(id)) stopped += 1;
    return stopped;
}

export const moduleSystem = {
    ModuleState, register, unregister, get, has, list, stateOf, init, start, stop,
    bootAll, stopAll, setLibVersion, resolveVersion
};
