/** Runtime feature detection for optional Bedrock APIs. */
import * as mcserver from '@minecraft/server';
function hasClass(name) { return typeof mcserver[name] === 'function'; }
function hasMember(object, member) { return object != null && member in object; }
function hasCustomCommands() { return hasClass('CustomCommandRegistry'); }
function hasScriptEvents() { return hasMember(mcserver.system?.afterEvents, 'scriptEventReceive'); }
// server-ui is a separate module, so this layer reports only a directly observable global export.
function hasServerUi() { return typeof globalThis.ActionFormData === 'function'; }
export const feature = { hasClass, hasMember, hasCustomCommands, hasScriptEvents, hasServerUi };
