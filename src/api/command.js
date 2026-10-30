/** Custom command facade. Definitions are buffered until Bedrock's startup phase. */

import * as mcserver from '@minecraft/server';
import { log } from '../core/logger.js';

const commandLog = log.create('command');
const pending = new Map();
let flushed = false;
const Status = mcserver.CustomCommandStatus ?? { Success: 0, Failure: 1 };

function register(definition) {
    if (flushed) {
        commandLog.warn(`command "${definition?.name}" registered after startup; it will be ignored`);
        return false;
    }
    if (!definition || typeof definition.name !== 'string' || !definition.name.includes(':')) {
        commandLog.error('command registration rejected: "name" must be namespaced, e.g. "limeracs:example"');
        return false;
    }
    if (pending.has(definition.name)) { commandLog.warn(`command "${definition.name}" already registered, ignoring duplicate`); return false; }
    if (typeof definition.callback !== 'function') { commandLog.error(`command "${definition.name}" requires a callback`); return false; }
    pending.set(definition.name, definition);
    return true;
}

function list() { return [...pending.keys()]; }

function wrapCallback(callback) {
    return (origin, ...args) => {
        try {
            const result = callback(origin, ...args);
            if (result && typeof result === 'object' && 'status' in result) return result;
            return { status: Status.Success };
        } catch (error) {
            commandLog.error('command handler threw:', error?.message ?? error);
            return { status: Status.Failure, message: String(error?.message ?? error) };
        }
    };
}

function flush(startupEvent) {
    if (flushed) return;
    flushed = true;
    const registry = startupEvent?.customCommandRegistry;
    if (!registry?.registerCommand) { commandLog.warn('custom command registry is unavailable in this runtime'); return; }
    for (const [name, definition] of pending) {
        try {
            registry.registerCommand({
                name,
                description: definition.description ?? '',
                permissionLevel: definition.permissionLevel,
                mandatoryParameters: definition.mandatoryParameters ?? [],
                optionalParameters: definition.optionalParameters ?? []
            }, wrapCallback(definition.callback));
        } catch (error) {
            commandLog.error(`failed to register command "${name}":`, error?.message ?? error);
        }
    }
}

export const commandApi = { register, list };
export const commandInternal = { flush };
