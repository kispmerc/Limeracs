/**
 * Migration system for data whose schema/version has changed.
 * Migrations are registered as paths from one version to another, and migrate() walks them one step at a time.
 */

import { log } from '../core/logger.js';

const migrationLog = log.create('migration');
// key = scope:fromVersion -> next migration step
const migrations = new Map();

function key(scope, from) {
    return JSON.stringify([scope, from]);
}

function registerMigration(scope, fromVersion, toVersion, migrationFunction) {
    if (typeof scope !== 'string' || !scope || typeof fromVersion !== 'string' || !fromVersion
        || typeof toVersion !== 'string' || !toVersion || fromVersion === toVersion) {
        migrationLog.error('migration registration requires a scope and distinct, non-empty version strings');
        return false;
    }
    if (typeof migrationFunction !== 'function') {
        migrationLog.error(`migration for "${scope}" ${fromVersion}->${toVersion} is not a function`);
        return false;
    }
    const migrationKey = key(scope, fromVersion);
    if (migrations.has(migrationKey)) {
        migrationLog.error(`migration for "${scope}" from version ${fromVersion} is already registered`);
        return false;
    }
    migrations.set(migrationKey, { toVersion, migrationFunction });
    return true;
}

function migrate(scope, data, currentVersion, targetVersion) {
    let version = currentVersion;
    let payload = data;
    let steps = 0;
    const visited = new Set([version]);
    // Walk migrations one step at a time until the target; if a path is missing, stop at the latest reachable version.
    while (version !== targetVersion) {
        const step = migrations.get(key(scope, version));
        if (!step) {
            migrationLog.warn(`no migration path for "${scope}" from version ${version} to ${targetVersion}`);
            break;
        }
        if (visited.has(step.toVersion)) {
            migrationLog.error(`migration for "${scope}" entered a cycle at version ${step.toVersion}`);
            break;
        }
        if (steps >= 64) {
            migrationLog.error(`migration "${scope}" exceeded max steps, aborting to avoid infinite loop`);
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
        visited.add(version);
    }
    return { data: payload, version };
}

function hasPath(scope, fromVersion) {
    return migrations.has(key(scope, fromVersion));
}

export const migration = { registerMigration, migrate, hasPath };
