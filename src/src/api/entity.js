/** Entity facade for spawn/query/damage/heal/remove operations and entity-state helpers */

import { guard } from '../core/errors.js';

function spawn(dimension, identifier, location) {
    return guard(() => dimension.spawnEntity(identifier, location), undefined);
}

function remove(entity) {
    return guard(() => {
        entity.remove();
        return true;
    }, undefined) ?? false;
}

function kill(entity) {
    return guard(() => entity.kill(), false) ?? false;
}

function damage(entity, amount, options) {
    return guard(() => entity.applyDamage(amount, options), false) ?? false;
}

function heal(entity, amount, options) {
    return guard(() => {
        const health = entity.getComponent('health');
        if (!health) return false;
        health.setCurrentValue(Math.min(health.currentValue + amount, health.effectiveMax));
        return true;
    }, false) ?? false;
}

function getNearby(dimension, location, maxDistance, options) {
    return guard(() => dimension.getEntities({ location, maxDistance, ...(options ?? {}) }), []) ?? [];
}

function query(dimension, options) {
    return guard(() => dimension.getEntities(options), []) ?? [];
}

function isValid(entity) {
    return guard(() => entity.isValid(), false) ?? false;
}

function isAlive(entity) {
    return guard(() => {
        const health = entity.getComponent('health');
        return health ? health.currentValue > 0 : isValid(entity);
    }, false) ?? false;
}

function isPlayer(entity) {
    return entity?.typeId === 'minecraft:player';
}

function getId(entity) {
    return entity.id;
}

function getPosition(entity) {
    return entity.location;
}

function getDimension(entity) {
    return entity.dimension;
}

export const entityApi = { spawn, remove, kill, damage, heal, getNearby, query, isValid, isAlive, isPlayer, getId, getPosition, getDimension };
