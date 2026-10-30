/** Stateful timer built on scheduler.repeat(). */
import { scheduler } from '../core/scheduler.js';
let nextTimerId = 1;
const TimerState = Object.freeze({ IDLE: 'IDLE', RUNNING: 'RUNNING', PAUSED: 'PAUSED', COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED' });

function create(durationTicks) {
    const id = nextTimerId++;
    const state = { remaining: Math.max(0, durationTicks | 0), status: TimerState.IDLE, handle: null, callbacks: [] };
    function complete() {
        state.remaining = 0; state.status = TimerState.COMPLETED; state.handle?.cancel(); state.handle = null;
        for (const callback of [...state.callbacks]) { try { callback(); } catch {} }
    }
    function tick() {
        if (state.status !== TimerState.RUNNING) return;
        state.remaining -= 1;
        if (state.remaining <= 0) complete();
    }
    function start() {
        if (![TimerState.IDLE, TimerState.PAUSED].includes(state.status) || state.remaining <= 0) return false;
        state.status = TimerState.RUNNING;
        state.handle = scheduler.repeat(tick, 1, `timer:${id}`);
        return true;
    }
    function pause() {
        if (state.status !== TimerState.RUNNING) return false;
        state.status = TimerState.PAUSED; state.handle?.cancel(); state.handle = null; return true;
    }
    function resume() { return start(); }
    function cancel() {
        if (state.status === TimerState.CANCELLED) return false;
        state.handle?.cancel(); state.handle = null; state.status = TimerState.CANCELLED; return true;
    }
    function onComplete(callback) { if (typeof callback !== 'function') throw new TypeError('callback must be a function'); state.callbacks.push(callback); return () => { const i = state.callbacks.indexOf(callback); if (i >= 0) state.callbacks.splice(i, 1); }; }
    return {
        id, start, pause, resume, cancel,
        remaining: () => state.remaining,
        status: () => state.status,
        isRunning: () => state.status === TimerState.RUNNING,
        onComplete
    };
}
export const timer = { TimerState, create };
