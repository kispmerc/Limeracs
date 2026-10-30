/** Runtime @minecraft/server version detection. A missing runtime value is reported as unknown, never as a guessed version. */
import * as mcserver from '@minecraft/server';

const SUPPORTED_SERVER_MODULE_VERSION = '2.10.0';
function getServerModuleVersion() { return mcserver?.system?.serverSystemInfo?.moduleVersion ?? null; }
function hasExport(name) { return Object.prototype.hasOwnProperty.call(mcserver, name); }
export const apiVersion = { SUPPORTED_SERVER_MODULE_VERSION, getServerModuleVersion, hasExport };
