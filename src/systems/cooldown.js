import { system } from '@minecraft/server';

const cooldowns = new Map();

function ownerId(owner) {
    if (typeof owner === 'string') return owner;
    if (owner?.id !== undefined) return String(owner.id);
    return String(owner);
}

function compositeKey(owner, key) {
    return `${ownerId(owner)}::${key}`;
}

function start(owner, key, durationTicks) {
    const expiresAt = system.currentTick + Math.max(0, durationTicks | 0);
    cooldowns.set(compositeKey(owner, key), expiresAt);
    return expiresAt;
}

function remaining(owner, key) {
    const expiresAt = cooldowns.get(compositeKey(owner, key));
    if (expiresAt === undefined) return 0;
    const left = expiresAt - system.currentTick;
    if (left <= 0) {
        cooldowns.delete(compositeKey(owner, key));
        return 0;
    }
    return left;
}

function has(owner, key) {
    return remaining(owner, key) > 0;
}

function clear(owner, key) {
    return cooldowns.delete(compositeKey(owner, key));
}

export const cooldown = { start, has, remaining, clear };
