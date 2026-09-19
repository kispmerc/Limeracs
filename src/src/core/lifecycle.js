/**
 * Manages the Library lifecycle: BOOTING -> READY -> STOPPING -> STOPPED
 * boot() should only be called once; shutdown() is used when the entire system needs to stop.
 */

import { log } from './logger.js';
import { events } from './eventBus.js';

const lifecycleLog = log.create('lifecycle');

const LifecycleState = Object.freeze({
    BOOTING: 'BOOTING',
    READY: 'READY',
    STOPPING: 'STOPPING',
    STOPPED: 'STOPPED'
});

// This state is the source of truth for the entire Library lifecycle.
const state = {
    current: LifecycleState.BOOTING,
    booted: false,
    version: '1.0.0'
};

function boot(version, onBoot) {
    if (state.booted) {
        lifecycleLog.warn('boot() called more than once, ignoring');
        return false;
    }
    state.booted = true;
    state.version = version ?? state.version;
    state.current = LifecycleState.BOOTING;
    try {
        onBoot?.();
        // Only announce READY after onBoot completes, so consumers cannot observe a ready state too early.
        state.current = LifecycleState.READY;
        events.emit('sundown:ready', { version: state.version });
        lifecycleLog.info(`SUNDOWN LIB v${state.version} ready`);
        return true;
    } catch (error) {
        lifecycleLog.error('boot failed:', error?.message ?? error);
        state.current = LifecycleState.STOPPED;
        return false;
    }
}

function shutdown(onShutdown) {
    if (state.current === LifecycleState.STOPPED) return false;
    state.current = LifecycleState.STOPPING;
    try {
        onShutdown?.();
    } catch (error) {
        lifecycleLog.error('shutdown handler threw:', error?.message ?? error);
    }
    state.current = LifecycleState.STOPPED;
    events.emit('sundown:stopped', {});
    return true;
}

function getState() {
    return state.current;
}

function isReady() {
    return state.current === LifecycleState.READY;
}

function getVersion() {
    return state.version;
}

export const lifecycle = { LifecycleState, boot, shutdown, getState, isReady, getVersion };
