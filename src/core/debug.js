/** Debug facade for inspecting framework state without reaching into private maps. */
import { registry } from './registry.js';
import { moduleSystem } from './moduleSystem.js';
import { scheduler } from './scheduler.js';
import { events } from './eventBus.js';
import { log, LogLevel } from './logger.js';

const state = { enabled: false };
function enable() { state.enabled = true; log.setLevel(LogLevel.DEBUG); }
function disable() { state.enabled = false; log.setLevel(LogLevel.INFO); }
function inspectModules() { return moduleSystem.list(); }
function inspectRegistry() { return registry.categoryNames().map((category) => ({ category, count: registry.getAll(category).length })); }
function inspectScheduler() { return { activeTasks: scheduler.activeTaskCount(), tasks: scheduler.activeTasks() }; }
function inspectEvents(names = []) { return names.map((name) => ({ name, listeners: events.listenerCount(name) })); }
export const debugSystem = { enable, disable, isEnabled: () => state.enabled, inspect: { modules: inspectModules, registry: inspectRegistry, scheduler: inspectScheduler, events: inspectEvents } };
