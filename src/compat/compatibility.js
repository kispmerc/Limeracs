/**
 * Public compatibility report: combines version information and feature detection into one object.
 */

import { apiVersion } from './api-version.js';
import { feature } from './feature.js';

function report() {
    return {
        serverModuleVersion: apiVersion.getServerModuleVersion(),
        customCommands: feature.hasCustomCommands(),
        scriptEvents: feature.hasScriptEvents(),
        serverUi: feature.hasServerUi()
    };
}

export const compatibility = { report, apiVersion, feature };
