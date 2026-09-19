/**
 * Wrapper around Bedrock system.run*
 * Every task is stored in a Map so it has a cancellation handle and active task count can be inspected.
 */

import { system, TicksPerSecond } from '@minecraft/server';
import { log } from './logger.js';

const schedulerLog = log.create('scheduler');
// taskId -> task metadata; the source of truth for handles, cancellation, and debugging
const tasks = new Map();
let nextTaskId = 1;

// Wrap callbacks to verify the task is still active and prevent exceptions from breaking the scheduler callback.
function wrap(callback, taskId, repeatMode) {
    return () => {
        const task = tasks.get(taskId);
        if (!task || !task.active) return;
        try {
            callback();
        } catch (error) {
            schedulerLog.error(`task ${taskId} threw:`, error?.message ?? error);
        }
        if (!repeatMode) {
            tasks.delete(taskId);
        }
    };
}

// The returned handle lets callers cancel a task without knowing Minecraft API run IDs.
function makeHandle(taskId) {
    return {
        id: taskId,
        cancel() {
            const task = tasks.get(taskId);
            if (!task) return false;
            task.active = false;
            try {
                system.clearRun(task.runId);
            } catch {
            }
            tasks.delete(taskId);
            return true;
        },
        isActive() {
            return tasks.get(taskId)?.active ?? false;
        }
    };
}

function nextTick(callback) {
    const taskId = nextTaskId++;
    const runId = system.run(wrap(callback, taskId, false));
    tasks.set(taskId, { active: true, runId });
    return makeHandle(taskId);
}

function delay(callback, ticks) {
    const taskId = nextTaskId++;
    const runId = system.runTimeout(wrap(callback, taskId, false), Math.max(0, ticks | 0));
    tasks.set(taskId, { active: true, runId });
    return makeHandle(taskId);
}

function repeat(callback, intervalTicks) {
    const taskId = nextTaskId++;
    const runId = system.runInterval(wrap(callback, taskId, true), Math.max(1, intervalTicks | 0));
    tasks.set(taskId, { active: true, runId });
    return makeHandle(taskId);
}

function afterSeconds(callback, seconds) {
    return delay(callback, Math.round(seconds * TicksPerSecond));
}

function everySeconds(callback, seconds) {
    return repeat(callback, Math.max(1, Math.round(seconds * TicksPerSecond)));
}

function activeTaskCount() {
    return tasks.size;
}

export const scheduler = { nextTick, delay, repeat, afterSeconds, everySeconds, activeTaskCount };
