/**
 * Custom command API
 * register() stores the definition first; flush() registers it with Minecraft during startup.
 * Because the Custom Command Registry must be registered during the startup phase, pending definitions are kept separate until flush.
 */

import { CustomCommandStatus } from '@minecraft/server';
import { log } from '../core/logger.js';

const commandLog = log.create('command');
// Command definitions waiting for startup flush; the Map also prevents duplicate command names.
const pending = new Map();
// Registration is rejected after startup because the native API only allows registration during that phase.
let flushed = false;

function register(definition) {
    if (flushed) {
        commandLog.warn(`command "${definition?.name}" registered after startup, the stable Custom Command API only allows registration during world startup; this command will be ignored`);
        return false;
    }
    if (!definition || typeof definition.name !== 'string' || !definition.name.includes(':')) {
        commandLog.error('command registration rejected: "name" must be namespaced, e.g. "sundown:example"');
        return false;
    }
    if (pending.has(definition.name)) {
        commandLog.warn(`command "${definition.name}" already registered, ignoring duplicate`);
        return false;
    }
    pending.set(definition.name, definition);
    return true;
}

function list() {
    return Array.from(pending.keys());
}

function wrapCallback(callback) {
    return (origin, ...args) => {
        try {
            const result = callback(origin, ...args);
            if (result && typeof result === 'object' && 'status' in result) return result;
            return { status: CustomCommandStatus.Success };
        } catch (error) {
            commandLog.error('command handler threw:', error?.message ?? error);
            return { status: CustomCommandStatus.Failure, message: String(error?.message ?? error) };
        }
    };
}

// flush is the boundary between the Library API and Bedrock's CustomCommandRegistry.
function flush(startupEvent) {
    if (flushed) return;
    flushed = true;
    for (const [name, definition] of pending) {
        try {
            startupEvent.customCommandRegistry.registerCommand(
                {
                    name,
                    description: definition.description ?? '',
                    permissionLevel: definition.permissionLevel,
                    mandatoryParameters: definition.mandatoryParameters ?? [],
                    optionalParameters: definition.optionalParameters ?? []
                },
                wrapCallback(definition.callback)
            );
        } catch (error) {
            commandLog.error(`failed to register command "${name}":`, error?.message ?? error);
        }
    }
}

export const commandApi = { register, list };
export const commandInternal = { flush };
