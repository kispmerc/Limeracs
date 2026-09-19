# SUNDOWN LIB API Reference

Import the public entry point:

```javascript
import { Lib } from "./index.js";
```

All members below are reachable from `Lib`.

## Lib.version

`string` - current Limeracs LIB version, e.g. `"1.0.0"`.

## Lib.module

Module registration and lifecycle.

- `register(definition)` - `{ id, version, dependencies?, init?, start?, stop? }`. Returns `boolean`.
- `unregister(id)` - stops the module if running, then removes it.
- `get(id)` - returns the stored definition or `undefined`.
- `has(id)` - `boolean`.
- `list()` - `{ id, version, state }[]`.
- `stateOf(id)` - one of `REGISTERED | INITIALIZED | STARTED | STOPPED | FAILED`.
- `init(id, context)` - runs `definition.init(context)`, validates dependencies first.
- `start(id)` - runs `definition.start(context)`.
- `stop(id)` - runs `definition.stop(context)`.
- `bootAll(context)` - initializes and starts every registered module.

Dependency ranges use `>=`, `<=`, `>`, `<`, `=`, `^`, `~` against SemVer
versions, resolved against `Lib.module.register`'s own `version` field or a
version set via `setLibVersion` (used internally for `sundown_lib`).

## Lib.events

- `on(name, handler, options?)` - `options.priority` (higher runs first). Returns an unsubscribe function.
- `once(name, handler, options?)` - same as `on`, auto-removed after firing.
- `off(name, handler)` - `boolean`.
- `emit(name, data)` - synchronous, isolates listener exceptions.
- `listenerCount(name)` - `number`.
- `clear(name?)` - removes all listeners for `name`, or every listener if omitted.
- `namespaced(prefix)` - returns `{ on, once, off, emit, listenerCount }` scoped under `"prefix:name"`.

Bridged native event names: `playerJoin`, `playerLeave`, `playerSpawn`,
`entitySpawn`, `entityDie`, `entityHurt`, `itemUse`, `blockPlace`,
`blockBreak`, `weatherChange`, `worldReady`, and the cancellable
`itemUseBefore`, `blockBreakBefore`, `chatSendBefore`.

## Lib.registry

- `register(category, id, value)` - `boolean`, rejects duplicates.
- `get(category, id)`
- `has(category, id)`
- `remove(category, id)`
- `getAll(category)` - `{ id, value }[]`.
- `clear(category?)`
- `categoryNames()`

Suggested categories: `modules`, `commands`, `systems`, `items`, `blocks`,
`entities`, `effects`, `quests`, `skills`, `recipes`, `services`, `custom`.

## Lib.scheduler

- `nextTick(callback)` - runs on the next tick.
- `delay(callback, ticks)`
- `repeat(callback, intervalTicks)`
- `afterSeconds(callback, seconds)`
- `everySeconds(callback, seconds)`
- `activeTaskCount()`

Each scheduling call returns a task handle: `{ id, cancel(), isActive() }`.
Handles are cleaned up automatically once a one-shot task finishes.

## Lib.log

- `info(...args)`, `warn(...args)`, `error(...args)`, `debug(...args)`
- `create(namespace)` - returns a namespaced `{ debug, info, warn, error }`.
- `setLevel(level)` - accepts `"DEBUG" | "INFO" | "WARN" | "ERROR"` or a numeric `LogLevel`.
- `getLevel()`
- `setSink(fn)` - override the underlying output function (defaults to `console.log`).

## Lib.debug

- `enable()` / `disable()` / `isEnabled()`
- `inspect.modules()`
- `inspect.registry()`
- `inspect.scheduler()`
- `inspect.events(names)`

Does not expose destructive operations by default.

## Lib.storage

- `world()` - returns a store scoped to the world.
- `module(id)` - returns a store namespaced to a module id.
- `player(player)` - returns a store scoped to that player.

Each store: `get(key, fallback?)`, `set(key, value)`, `has(key)`,
`delete(key)`, `clear()`, `keys()`, `values()`, `entries()`,
`increment(key, amount = 1)`, `decrement(key, amount = 1)`,
`update(key, updater)`.

Implemented over `getDynamicProperty` / `setDynamicProperty` /
`getDynamicPropertyIds`, JSON-encoded. Subject to Minecraft's dynamic
property size limits.

## Lib.schema

- `define(name, shape, options?)` - `shape` maps field name to
  `"string" | "number" | "boolean" | "object" | "array"`. `options.defaults`,
  `options.version`.
- `get(name)`
- `has(name)`
- `validate(name, data)` - `{ valid, errors }`.
- `applyDefaults(name, data)`
- `versionOf(name)`

## Lib.migration

- `registerMigration(scope, fromVersion, toVersion, migrationFunction)`
- `migrate(scope, data, currentVersion, targetVersion)` - `{ data, version }`, stops if no path exists or after 64 steps.
- `hasPath(scope, fromVersion)`

## Lib.config

- `create(namespace, defaults)` - idempotent, returns the same proxy on repeated calls.
- `get(namespace)`
- `has(namespace)`

Config proxy: `get(key)`, `set(key, value)`, `has(key)`, `reset(key?)`,
`getAll()`.

## Lib.cooldown

- `start(owner, key, durationTicks)`
- `has(owner, key)`
- `remaining(owner, key)`
- `clear(owner, key)`

`owner` may be a string id or any object with an `id` property (players,
entities).

## Lib.timer

- `create(durationTicks)` returns `{ id, start(), pause(), resume(), cancel(), remaining(), isRunning(), onComplete(callback) }`.

## Lib.permission

- `grant(target, permission)`
- `has(target, permission)` - supports trailing `.*` wildcards and a global `*`.
- `revoke(target, permission)`
- `list(target)`
- `clear(target)`

## Lib.metadata

Runtime-only key/value pairs per target: `get`, `set`, `has`, `delete`,
`clear`. Not persisted; distinct from `Lib.storage`.

## Lib.state

Namespaced runtime state store: `get(ns, key)`, `set(ns, key, value)`,
`has(ns, key)`, `delete(ns, key)`, `clear(ns?)`.

## Lib.cache

`get(key)`, `set(key, value, ttlTicks?)`, `has(key)`, `delete(key)`,
`clear()`. Expired entries are swept periodically and on access.

## Lib.player

`getName`, `getId`, `getPosition`, `getRotation`, `getDimension`,
`teleport(target, location, options?)`, `sendMessage(target, message)`,
`actionBar(target, message)`, `title(target, text, options?)`,
`subtitle(target, text)`, `playSound(target, soundId, options?)`,
`addEffect(target, effectType, duration, options?)`,
`removeEffect(target, effectType)`, `hasEffect(target, effectType)`,
`getGameMode(target)`, `isValid(target)`.

All calls are wrapped so a thrown native error returns a safe fallback
(`false`/`undefined`/`[]`) instead of propagating.

## Lib.entity

`spawn(dimension, identifier, location)`, `remove(entity)`, `kill(entity)`,
`damage(entity, amount, options?)`, `heal(entity, amount, options?)`,
`getNearby(dimension, location, maxDistance, options?)`,
`query(dimension, options)`, `isValid(entity)`, `isAlive(entity)`,
`isPlayer(entity)`, `getId(entity)`, `getPosition(entity)`,
`getDimension(entity)`.

## Lib.world

`getAllPlayers()`, `getPlayer(name)`, `getDimensions()`,
`sendMessage(message)`, `getAbsoluteTime()`, `getTimeOfDay()`,
`setTimeOfDay(ticks)`, `getDefaultSpawnLocation()`,
`setDefaultSpawnLocation(location)`, `getGameRule(rule)`,
`setGameRule(rule, value)`.

## Lib.dimension

`overworld()`, `nether()`, `theEnd()`, `byId(id)`,
`getEntities(dimension, options)`, `getBlock(dimension, location)`,
`runCommand(dimension, command)`.

## Lib.block

`get(dimension, location)`, `set(dimension, location, permutationOrTypeId)`,
`replace(dimension, location, matchTypeId, replacementTypeId)`,
`is(block, typeId)`, `getPermutation(block)`, `getTypeId(block)`.

`replace` and `set` operate on a single block; there is intentionally no
bulk/world-scan helper to avoid encouraging expensive world-wide scans.

## Lib.item

`create(typeId, amount?)`, `clone(item)`, `getId(item)`, `getTypeId(item)`,
`getAmount(item)`, `setAmount(item, amount)`, `getLore(item)`,
`setLore(item, lore)`, `addLore(item, line)`, `clearLore(item)`,
`getNameTag(item)`, `setNameTag(item, name)`.

## Lib.inventory

`getInventory(entity)`, `getContainer(entity)`, `add(entity, item)`,
`remove(entity, typeId, amount?)`, `count(entity, typeId)`,
`has(entity, typeId)`, `clear(entity)`, `find(entity, predicate)`.

## Lib.scoreboard

`create(objectiveId, displayName)`, `get(objectiveId)`,
`hasObjective(objectiveId)`, `getObjective(objectiveId)`,
`set(objectiveId, participant, score)`, `add(objectiveId, participant, amount)`,
`remove(objectiveId)`, `reset(objectiveId, participant)`.

## Lib.command

- `register(definition)` - `{ name: "namespace:command", description?, permissionLevel?, mandatoryParameters?, optionalParameters?, callback }`. Must be called before the world's `startup` event fires; SUNDOWN LIB flushes all queued commands into the stable `CustomCommandRegistry` automatically.
- `list()` - names of commands queued so far.

See "Known limitations" in the README for what this can and cannot do.

## Lib.ui

- `actionForm(player, { title?, body?, buttons: [{ text, iconPath? }] })`
- `modalForm(player, { title?, fields: [{ type: "toggle"|"slider"|"dropdown"|"textField", label, ... }] })`
- `messageForm(player, { title?, body?, button1?, button2? })`

Each returns whatever the underlying `@minecraft/server-ui` form's `show()`
resolves to (including cancellation info), or `undefined` if the call
threw.

## Lib.math

`clamp`, `lerp`, `inverseLerp`, `map`, `round`, `floor`, `ceil`, `abs`,
`min`, `max`, `sign`, `degToRad`, `radToDeg`.

## Lib.vector

`add`, `subtract`, `multiply`, `divide`, `length`, `lengthSquared`,
`normalize`, `distance`, `distanceSquared`, `direction`, `lerp`, `equals`,
`clone`, plus constants `zero`, `up`, `down`, `forward`. None of these
mutate their input arguments; each returns a new plain `{x,y,z}` object.

## Lib.random

`int(min, max)`, `float(min, max)`, `choice(list)`, `chance(probability)`,
`weighted(entries)` where `entries` is `{ value, weight }[]`.

## Lib.string

`capitalize`, `truncate(value, maxLength, suffix = "...")`, `isBlank`,
`safeFormat(template, values)` (replaces `{key}` placeholders).

## Lib.array

`unique`, `chunk`, `random`, `remove`, `shuffle`. None mutate the input
array.

## Lib.object

`clone` (deep, via JSON round-trip - functions and non-JSON-safe values
are not preserved), `merge` (shallow), `pick`, `omit`.

## Lib.compatibility

- `report()` - `{ serverModuleVersion, customCommands, scriptEvents, serverUi }`.
- `apiVersion` - `{ SERVER_MODULE_VERSION, getServerModuleVersion(), hasExport(name) }`.
- `feature` - `{ hasClass(name), hasMember(object, member), hasCustomCommands(), hasScriptEvents(), hasServerUi() }`.

## Lib.lifecycle

- `LifecycleState` - `BOOTING | READY | STOPPING | STOPPED`.
- `boot(version, onBoot)` - guarded against double-boot.
- `shutdown(onShutdown)`
- `getState()`
- `isReady()`
- `getVersion()`

SUNDOWN LIB calls `boot` once for itself on import; consuming modules do
not need to call it.
