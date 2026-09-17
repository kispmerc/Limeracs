import { world } from '@minecraft/server';
import { guard } from '../core/errors.js';

function overworld() {
    return world.getDimension('overworld');
}

function nether() {
    return world.getDimension('nether');
}

function theEnd() {
    return world.getDimension('the_end');
}

function byId(id) {
    return guard(() => world.getDimension(id), undefined);
}

function getEntities(dimension, options) {
    return guard(() => dimension.getEntities(options), []) ?? [];
}

function getBlock(dimension, location) {
    return guard(() => dimension.getBlock(location), undefined);
}

function runCommand(dimension, command) {
    return guard(() => dimension.runCommand(command), undefined);
}

export const dimensionApi = { overworld, nether, theEnd, byId, getEntities, getBlock, runCommand };
