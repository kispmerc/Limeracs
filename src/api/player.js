/** Player facade for player data and common actions such as messages, titles, teleportation, and effects */

import { guard } from '../core/errors.js';

function getName(target) {
    return target.name;
}

function getId(target) {
    return target.id;
}

function getPosition(target) {
    return target.location;
}

function getRotation(target) {
    return target.getRotation();
}

function getDimension(target) {
    return target.dimension;
}

function teleport(target, location, options) {
    return guard(() => {
        target.teleport(location, options);
        return true;
    }, undefined) ?? false;
}

function sendMessage(target, message) {
    return guard(() => {
        target.sendMessage(message);
        return true;
    }, undefined) ?? false;
}

function actionBar(target, message) {
    return guard(() => {
        target.onScreenDisplay.setActionBar(message);
        return true;
    }, undefined) ?? false;
}

function title(target, text, options) {
    return guard(() => {
        target.onScreenDisplay.setTitle(text, options);
        return true;
    }, undefined) ?? false;
}

function subtitle(target, text) {
    return guard(() => {
        target.onScreenDisplay.updateSubtitle(text);
        return true;
    }, undefined) ?? false;
}

function playSound(target, soundId, options) {
    return guard(() => {
        target.playSound(soundId, options);
        return true;
    }, undefined) ?? false;
}

function addEffect(target, effectType, duration, options) {
    return guard(() => {
        target.addEffect(effectType, duration, options);
        return true;
    }, undefined) ?? false;
}

function removeEffect(target, effectType) {
    return guard(() => target.removeEffect(effectType), undefined) ?? false;
}

function hasEffect(target, effectType) {
    return guard(() => target.getEffect(effectType) !== undefined, undefined) ?? false;
}

function getGameMode(target) {
    return guard(() => target.getGameMode(), undefined);
}

function isValid(target) {
    return guard(() => target.isValid(), false) ?? false;
}

export const playerApi = {
    getName,
    getId,
    getPosition,
    getRotation,
    getDimension,
    teleport,
    sendMessage,
    actionBar,
    title,
    subtitle,
    playSound,
    addEffect,
    removeEffect,
    hasEffect,
    getGameMode,
    isValid
};
