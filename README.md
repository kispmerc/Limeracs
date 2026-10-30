# Limeracs

Limeracs is a modular JavaScript framework for Minecraft Bedrock add-ons. It provides module lifecycle management, events, scheduling, persistent storage, and convenience APIs for common game objects.

## Use

Import the public entry point from your behavior pack script module:

```js
import { Lib } from "./path/to/Limeracs/src/index.js";

Lib.module.register({
  id: "example",
  version: "1.0.0",
  init(context) {
    context.on("playerJoin", (event) => {
      Lib.log.info(`${event.playerName} joined`);
    });
  },
  start() {
    Lib.log.info("Example module started");
  }
});

Lib.module.bootAll();
```

Limeracs itself boots when its entry point is imported. Register consumer modules before calling `Lib.module.bootAll()`. The import path above is an example; adjust it to match where the library is placed in your behavior pack. The code imports `@minecraft/server` and `@minecraft/server-ui`, so those modules must be available in the target Bedrock scripting runtime.

## Documentation

See [API.md](./API.md) for the public `Lib` API and its methods.

## Current limitations

- Custom commands must be registered before the Bedrock `startup` event. Late registrations are ignored.
- Storage uses Minecraft Dynamic Properties and is subject to the runtime's property size limits.
- Block helpers operate on one block at a time; there is no bulk world scan helper.
- This repository currently contains the library source and API reference; it does not include a package manifest, build pipeline, or test suite.
