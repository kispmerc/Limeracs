/** Scoreboard facade for creating objectives and reading/writing scores */

import { world } from '@minecraft/server';
import { guard } from '../core/errors.js';

function create(objectiveId, displayName) {
    return guard(() => world.scoreboard.addObjective(objectiveId, displayName), undefined);
}

function get(objectiveId) {
    return guard(() => world.scoreboard.getObjective(objectiveId), undefined);
}

function hasObjective(objectiveId) {
    return get(objectiveId) !== undefined;
}

function getObjective(objectiveId) {
    return get(objectiveId);
}

function set(objectiveId, participant, score) {
    return guard(() => {
        const objective = get(objectiveId);
        if (!objective) return false;
        objective.setScore(participant, score);
        return true;
    }, false) ?? false;
}

function add(objectiveId, participant, amount) {
    return guard(() => {
        const objective = get(objectiveId);
        if (!objective) return undefined;
        const current = guard(() => objective.getScore(participant), 0) ?? 0;
        const next = current + amount;
        objective.setScore(participant, next);
        return next;
    }, undefined);
}

function remove(objectiveId) {
    return guard(() => world.scoreboard.removeObjective(objectiveId), false) ?? false;
}

function reset(objectiveId, participant) {
    return guard(() => {
        const objective = get(objectiveId);
        if (!objective) return false;
        objective.removeParticipant(participant);
        return true;
    }, false) ?? false;
}

export const scoreboardApi = { create, get, hasObjective, getObjective, set, add, remove, reset };
