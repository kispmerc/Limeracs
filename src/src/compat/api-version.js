/**
 * Central source for @minecraft/server version information and helpers for checking runtime exports.
 */

import * as mcserver from '@minecraft/server';

const SERVER_MODULE_VERSION = '2.10.0';

function getServerModuleVersion() {
    return mcserver?.system?.serverSystemInfo?.moduleVersion ?? SERVER_MODULE_VERSION;
}

function hasExport(name) {
    return Object.prototype.hasOwnProperty.call(mcserver, name);
}

export const apiVersion = { SERVER_MODULE_VERSION, getServerModuleVersion, hasExport };
