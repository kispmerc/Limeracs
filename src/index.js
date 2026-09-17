import { world, system } from '@minecraft/server';
import { lifecycle } from './core/lifecycle.js';
import { moduleSystem } from './core/moduleSystem.js';
import { events, internal as eventInternal } from './core/eventBus.js';
import { registry } from './core/registry.js';
import { scheduler } from './core/scheduler.js';
import { log } from './core/logger.js';
import { debugSystem } from './core/debug.js';

import { storage } from './systems/storage.js';
import { schema } from './systems/schema.js';
import { migration } from './systems/migration.js';
import { config } from './systems/config.js';
import { cooldown } from './systems/cooldown.js';
import { timer } from './systems/timer.js';
import { permission } from './systems/permission.js';
import { metadata } from './systems/metadata.js';
import { state } from './systems/state.js';
import { cache } from './systems/cache.js';

import { playerApi } from './api/player.js';
import { entityApi } from './api/entity.js';
import { worldApi } from './api/world.js';
import { dimensionApi } from './api/dimension.js';
import { blockApi } from './api/block.js';
import { itemApi } from './api/item.js';
import { inventoryApi } from './api/inventory.js';
import { scoreboardApi } from './api/scoreboard.js';
import { commandApi, commandInternal } from './api/command.js';

import { ui } from './ui/forms.js';

import { mathUtils } from './utils/math.js';
import { vector } from './utils/vector.js';
import { randomUtils } from './utils/random.js';
import { stringUtils } from './utils/string.js';
import { arrayUtils } from './utils/array.js';
import { objectUtils } from './utils/object.js';

import { compatibility } from './compat/compatibility.js';

const VERSION = '1.0.0';
const LIB_ID = 'sundown_lib';

function bridgeNativeEvents() {
    eventInternal.bridgeAfterEvent('playerJoin', world.afterEvents.playerJoin);
    eventInternal.bridgeAfterEvent('playerLeave', world.afterEvents.playerLeave);
    eventInternal.bridgeAfterEvent('playerSpawn', world.afterEvents.playerSpawn);
    eventInternal.bridgeAfterEvent('entitySpawn', world.afterEvents.entitySpawn);
    eventInternal.bridgeAfterEvent('entityDie', world.afterEvents.entityDie);
    eventInternal.bridgeAfterEvent('entityHurt', world.afterEvents.entityHurt);
    eventInternal.bridgeAfterEvent('itemUse', world.afterEvents.itemUse);
    eventInternal.bridgeAfterEvent('blockPlace', world.afterEvents.playerPlaceBlock);
    eventInternal.bridgeAfterEvent('blockBreak', world.afterEvents.playerBreakBlock);
    eventInternal.bridgeAfterEvent('weatherChange', world.afterEvents.weatherChange);

    eventInternal.bridgeBeforeEvent('itemUseBefore', world.beforeEvents.itemUse);
    eventInternal.bridgeBeforeEvent('blockBreakBefore', world.beforeEvents.playerBreakBlock);
    eventInternal.bridgeBeforeEvent('chatSendBefore', world.beforeEvents.chatSend);
}

function bridgeStartup() {
    try {
        system.beforeEvents.startup.subscribe((startupEvent) => {
            commandInternal.flush(startupEvent);
        });
    } catch (error) {
        log.create('bootstrap').warn('custom command registry unavailable:', error?.message ?? error);
    }
}

moduleSystem.setLibVersion(LIB_ID, VERSION);

lifecycle.boot(VERSION, () => {
    bridgeNativeEvents();
    bridgeStartup();
    system.run(() => events.emit('worldReady', {}));
});

export const Lib = {
    version: VERSION,
    module: moduleSystem,
    events,
    registry,
    scheduler,
    log,
    debug: debugSystem,
    storage,
    config,
    schema,
    migration,

    player: playerApi,
    entity: entityApi,
    world: worldApi,
    dimension: dimensionApi,
    block: blockApi,
    item: itemApi,
    inventory: inventoryApi,
    scoreboard: scoreboardApi,
    command: commandApi,

    ui,

    cooldown,
    timer,
    permission,
    metadata,
    state,
    cache,

    math: mathUtils,
    vector,
    random: randomUtils,
    string: stringUtils,
    array: arrayUtils,
    object: objectUtils,

    compatibility,
    lifecycle
};

export default Lib;
