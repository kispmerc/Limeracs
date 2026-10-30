/** Limeracs lifecycle: BOOTING -> READY -> STOPPING -> STOPPED. */

import { system } from '@minecraft/server';
import { log } from './logger.js';
import { events } from './eventBus.js';
import { scheduler } from './scheduler.js';
import { moduleSystem } from './moduleSystem.js';

const lifecycleLog = log.create('lifecycle');
const LifecycleState = Object.freeze({ BOOTING: 'BOOTING', READY: 'READY', STOPPING: 'STOPPING', STOPPED: 'STOPPED' });
const state = { current: LifecycleState.BOOTING, booted: false, version: '1.0.0' };

function boot(version, onBoot) {
    if (state.booted) { lifecycleLog.warn('boot() called more than once, ignoring'); return false; }
    state.booted = true;
    state.version = version ?? state.version;
    state.current = LifecycleState.BOOTING;
    try {
        onBoot?.();
        state.current = LifecycleState.READY;
        // Defer READY notification so modules importing Limeracs after bootstrap can still subscribe safely.
        system.run(() => {
            events.emit('limeracs:ready', { version: state.version });
            lifecycleLog.info(`LIMERACS LIB v${state.version} ready`);
        });
        return true;
    } catch (error) {
        lifecycleLog.error('boot failed:', error?.message ?? error);
        state.current = LifecycleState.STOPPED;
        return false;
    }
}

function shutdown(onShutdown) {
    if (state.current === LifecycleState.STOPPED || state.current === LifecycleState.STOPPING) return false;
    state.current = LifecycleState.STOPPING;
    try { onShutdown?.(); } catch (error) { lifecycleLog.error('shutdown handler threw:', error?.message ?? error); }
    moduleSystem.stopAll();
    scheduler.cancelAll();
    state.current = LifecycleState.STOPPED;
    events.emit('limeracs:stopped', {});
    return true;
}

export const lifecycle = {
    LifecycleState, boot, shutdown,
    getState: () => state.current,
    isReady: () => state.current === LifecycleState.READY,
    getVersion: () => state.version
};
