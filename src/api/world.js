/** World facade for player lists, time, spawn, gamerules, and broadcasts */

import { world } from '@minecraft/server';
import { guard } from '../core/errors.js';

function getAllPlayers() {
    return guard(() => world.getAllPlayers(), []) ?? [];
}

function getPlayer(name) {
    return getAllPlayers().find((player) => player.name === name);
}

function getDimensions() {
    return guard(() => ['overworld', 'nether', 'the_end'].map((id) => world.getDimension(id)), []) ?? [];
}

function sendMessage(message) {
    return guard(() => {
        world.sendMessage(message);
        return true;
    }, undefined) ?? false;
}

function getAbsoluteTime() {
    return guard(() => world.getAbsoluteTime(), undefined);
}

function getTimeOfDay() {
    return guard(() => world.getTimeOfDay(), undefined);
}

function setTimeOfDay(ticks) {
    return guard(() => {
        world.setTimeOfDay(ticks);
        return true;
    }, undefined) ?? false;
}

function getDefaultSpawnLocation() {
    return guard(() => world.getDefaultSpawnLocation(), undefined);
}

function setDefaultSpawnLocation(location) {
    return guard(() => {
        world.setDefaultSpawnLocation(location);
        return true;
    }, undefined) ?? false;
}

function getGameRule(rule) {
    return guard(() => world.gameRules[rule], undefined);
}

function setGameRule(rule, value) {
    return guard(() => {
        world.gameRules[rule] = value;
        return true;
    }, undefined) ?? false;
}

export const worldApi = {
    getAllPlayers,
    getPlayer,
    getDimensions,
    sendMessage,
    getAbsoluteTime,
    getTimeOfDay,
    setTimeOfDay,
    getDefaultSpawnLocation,
    setDefaultSpawnLocation,
    getGameRule,
    setGameRule
};
