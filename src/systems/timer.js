import { scheduler } from '../core/scheduler.js';

let nextTimerId = 1;

function create(durationTicks) {
    const id = nextTimerId++;
    const state = {
        id,
        remaining: Math.max(0, durationTicks | 0),
        running: false,
        handle: null,
        onCompleteCallbacks: []
    };

    function tick() {
        if (!state.running) return;
        state.remaining -= 1;
        if (state.remaining <= 0) {
            state.remaining = 0;
            state.running = false;
            state.handle?.cancel();
            state.handle = null;
            for (const callback of state.onCompleteCallbacks) {
                try {
                    callback();
                } catch {
                }
            }
        }
    }

    return {
        id,
        start() {
            if (state.running) return false;
            state.running = true;
            state.handle = scheduler.repeat(tick, 1);
            return true;
        },
        pause() {
            if (!state.running) return false;
            state.running = false;
            state.handle?.cancel();
            state.handle = null;
            return true;
        },
        resume() {
            return this.start();
        },
        cancel() {
            state.running = false;
            state.handle?.cancel();
            state.handle = null;
            state.remaining = 0;
            return true;
        },
        remaining() {
            return state.remaining;
        },
        isRunning() {
            return state.running;
        },
        onComplete(callback) {
            if (typeof callback === 'function') state.onCompleteCallbacks.push(callback);
        }
    };
}

export const timer = { create };
