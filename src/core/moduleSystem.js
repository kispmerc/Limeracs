import { log } from './logger.js';
import { semver } from '../data/semver.js';
import { events } from './eventBus.js';

const moduleLog = log.create('module');

const ModuleState = Object.freeze({
    REGISTERED: 'REGISTERED',
    INITIALIZED: 'INITIALIZED',
    STARTED: 'STARTED',
    STOPPED: 'STOPPED',
    FAILED: 'FAILED'
});

const modules = new Map();
const versions = new Map();

function setLibVersion(id, version) {
    versions.set(id, version);
}

function resolveVersion(id) {
    if (versions.has(id)) return versions.get(id);
    return modules.get(id)?.definition.version;
}

function validateDependencies(definition) {
    if (!definition.dependencies) return { ok: true, missing: [] };
    const missing = [];
    for (const [depId, range] of Object.entries(definition.dependencies)) {
        const depVersion = resolveVersion(depId);
        if (depVersion === undefined) {
            missing.push(`${depId} (not registered)`);
            continue;
        }
        if (!semver.satisfies(depVersion, range)) {
            missing.push(`${depId}@${range} (found ${depVersion})`);
        }
    }
    return { ok: missing.length === 0, missing };
}

function register(definition) {
    if (!definition || typeof definition.id !== 'string' || definition.id.length === 0) {
        moduleLog.error('module registration rejected: missing id');
        return false;
    }
    if (modules.has(definition.id)) {
        moduleLog.warn(`module "${definition.id}" already registered, ignoring duplicate`);
        return false;
    }
    if (definition.version !== undefined && !semver.isValid(definition.version)) {
        moduleLog.error(`module "${definition.id}" has invalid version "${definition.version}"`);
        return false;
    }
    modules.set(definition.id, { definition, state: ModuleState.REGISTERED, context: {} });
    moduleLog.debug(`registered "${definition.id}"@${definition.version ?? '0.0.0'}`);
    return true;
}

function unregister(id) {
    const record = modules.get(id);
    if (!record) return false;
    if (record.state === ModuleState.STARTED) {
        stop(id);
    }
    modules.delete(id);
    return true;
}

function get(id) {
    return modules.get(id)?.definition;
}

function has(id) {
    return modules.has(id);
}

function list() {
    return Array.from(modules.entries()).map(([id, record]) => ({
        id,
        version: record.definition.version,
        state: record.state
    }));
}

function stateOf(id) {
    return modules.get(id)?.state;
}

function init(id, context) {
    const record = modules.get(id);
    if (!record) return false;
    if (record.state !== ModuleState.REGISTERED) return false;
    const check = validateDependencies(record.definition);
    if (!check.ok) {
        moduleLog.error(`"${id}" cannot initialize, missing dependencies: ${check.missing.join(', ')}`);
        record.state = ModuleState.FAILED;
        return false;
    }
    record.context = context ?? {};
    try {
        record.definition.init?.(record.context);
        record.state = ModuleState.INITIALIZED;
        return true;
    } catch (error) {
        moduleLog.error(`"${id}" init() threw:`, error?.message ?? error);
        record.state = ModuleState.FAILED;
        return false;
    }
}

function start(id) {
    const record = modules.get(id);
    if (!record) return false;
    if (record.state !== ModuleState.INITIALIZED) return false;
    try {
        record.definition.start?.(record.context);
        record.state = ModuleState.STARTED;
        events.emit('sundown:module:started', { id });
        return true;
    } catch (error) {
        moduleLog.error(`"${id}" start() threw:`, error?.message ?? error);
        record.state = ModuleState.FAILED;
        return false;
    }
}

function stop(id) {
    const record = modules.get(id);
    if (!record) return false;
    if (record.state !== ModuleState.STARTED) return false;
    try {
        record.definition.stop?.(record.context);
    } catch (error) {
        moduleLog.error(`"${id}" stop() threw:`, error?.message ?? error);
    }
    record.state = ModuleState.STOPPED;
    events.emit('sundown:module:stopped', { id });
    return true;
}

function bootAll(context) {
    for (const id of modules.keys()) init(id, context);
    for (const id of modules.keys()) {
        if (modules.get(id).state === ModuleState.INITIALIZED) start(id);
    }
}

export const moduleSystem = {
    ModuleState,
    register,
    unregister,
    get,
    has,
    list,
    stateOf,
    init,
    start,
    stop,
    bootAll,
    setLibVersion,
    resolveVersion
};
