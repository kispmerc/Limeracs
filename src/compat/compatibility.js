/** Public compatibility report combining runtime version information and optional feature detection. */
import { apiVersion } from './api-version.js';
import { feature } from './feature.js';
function report() {
    return {
        serverModuleVersion: apiVersion.getServerModuleVersion(),
        supportedServerModuleVersion: apiVersion.SUPPORTED_SERVER_MODULE_VERSION,
        customCommands: feature.hasCustomCommands(),
        scriptEvents: feature.hasScriptEvents(),
        serverUi: feature.hasServerUi()
    };
}
export const compatibility = { report, apiVersion, feature };
