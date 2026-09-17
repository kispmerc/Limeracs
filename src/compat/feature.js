import * as mcserver from '@minecraft/server';

function hasClass(name) {
    return typeof mcserver[name] === 'function';
}

function hasMember(object, member) {
    if (object === undefined || object === null) return false;
    return member in object || typeof object[member] === 'function';
}

function hasCustomCommands() {
    return hasClass('CustomCommandRegistry');
}

function hasScriptEvents() {
    return hasMember(mcserver.system, 'afterEvents') && hasMember(mcserver.system.afterEvents, 'scriptEventReceive');
}

function hasServerUi() {
    try {
        return true;
    } catch {
        return false;
    }
}

export const feature = { hasClass, hasMember, hasCustomCommands, hasScriptEvents, hasServerUi };
