/** Runtime feature detection for optional Bedrock APIs. */
import * as mcserver from '@minecraft/server';
import * as mcserverUi from '@minecraft/server-ui';
function hasClass(name) { return typeof mcserver[name] === 'function'; }
function hasMember(object, member) { return object != null && member in object; }
function hasCustomCommands() { return hasClass('CustomCommandRegistry'); }
function hasScriptEvents() { return hasMember(mcserver.system?.afterEvents, 'scriptEventReceive'); }
function hasServerUi() {
    return ['ActionFormData', 'ModalFormData', 'MessageFormData'].every((name) => typeof mcserverUi[name] === 'function');
}
export const feature = { hasClass, hasMember, hasCustomCommands, hasScriptEvents, hasServerUi };
