import { log } from '../core/logger.js';

const migrationLog = log.create('migration');
const migrations = new Map();

function key(scope, from) {
    return `${scope}:${from}`;
}

function registerMigration(scope, fromVersion, toVersion, migrationFunction) {
    if (typeof migrationFunction !== 'function') {
        migrationLog.error(`migration for "${scope}" ${fromVersion}->${toVersion} is not a function`);
        return false;
    }
    migrations.set(key(scope, fromVersion), { toVersion, migrationFunction });
    return true;
}

function migrate(scope, data, currentVersion, targetVersion) {
    let version = currentVersion;
    let payload = data;
    let steps = 0;
    while (version !== targetVersion) {
        const step = migrations.get(key(scope, version));
        if (!step) {
            migrationLog.warn(`no migration path for "${scope}" from version ${version} to ${targetVersion}`);
            break;
        }
        try {
            payload = step.migrationFunction(payload);
        } catch (error) {
            migrationLog.error(`migration "${scope}" ${version}->${step.toVersion} threw:`, error?.message ?? error);
            break;
        }
        version = step.toVersion;
        steps += 1;
        if (steps > 64) {
            migrationLog.error(`migration "${scope}" exceeded max steps, aborting to avoid infinite loop`);
            break;
        }
    }
    return { data: payload, version };
}

function hasPath(scope, fromVersion) {
    return migrations.has(key(scope, fromVersion));
}

export const migration = { registerMigration, migrate, hasPath };
