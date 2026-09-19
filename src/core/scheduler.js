/** Wrapper around Bedrock system.run*, with cancellation and owner scopes. */

import { system, TicksPerSecond } from '@minecraft/server';
import { log } from './logger.js';

const schedulerLog = log.create('scheduler');
const tasks = new Map();
let nextTaskId = 1;

function wrap(callback, taskId, repeatMode) {
    return () => {
        const task = tasks.get(taskId);
        if (!task?.active) return;
        try { callback(); } catch (error) { schedulerLog.error(`task ${taskId} threw:`, error?.message ?? error); }
        if (!repeatMode) tasks.delete(taskId);
    };
}

function makeHandle(taskId) {
    return {
        id: taskId,
        cancel() {
            const task = tasks.get(taskId);
            if (!task) return false;
            task.active = false;
            try { system.clearRun(task.runId); } catch { /* already finished */ }
            tasks.delete(taskId);
            return true;
        },
        isActive: () => tasks.get(taskId)?.active ?? false
    };
}

function schedule(kind, callback, ticks, owner) {
    if (typeof callback !== 'function') throw new TypeError('callback must be a function');
    const taskId = nextTaskId++;
    const wrapped = wrap(callback, taskId, kind === 'repeat');
    let runId;
    if (kind === 'next') runId = system.run(wrapped);
    else if (kind === 'delay') runId = system.runTimeout(wrapped, Math.max(0, ticks | 0));
    else runId = system.runInterval(wrapped, Math.max(1, ticks | 0));
    tasks.set(taskId, { active: true, runId, owner });
    return makeHandle(taskId);
}

function nextTick(callback, owner) { return schedule('next', callback, 0, owner); }
function delay(callback, ticks, owner) { return schedule('delay', callback, ticks, owner); }
function repeat(callback, intervalTicks, owner) { return schedule('repeat', callback, intervalTicks, owner); }
function afterSeconds(callback, seconds, owner) { return delay(callback, Math.round(seconds * TicksPerSecond), owner); }
function everySeconds(callback, seconds, owner) { return repeat(callback, Math.max(1, Math.round(seconds * TicksPerSecond)), owner); }

function cancelOwner(owner) {
    let count = 0;
    for (const [id, task] of tasks) {
        if (task.owner !== owner) continue;
        if (makeHandle(id).cancel()) count += 1;
    }
    return count;
}

function cancelAll() {
    let count = 0;
    for (const id of [...tasks.keys()]) if (makeHandle(id).cancel()) count += 1;
    return count;
}

function activeTaskCount() { return tasks.size; }
function activeTasks() {
    return [...tasks.entries()].map(([id, task]) => ({ id, owner: task.owner, active: task.active }));
}

export const scheduler = {
    nextTick, delay, repeat, afterSeconds, everySeconds,
    cancelOwner, cancelAll, activeTaskCount, activeTasks
};
