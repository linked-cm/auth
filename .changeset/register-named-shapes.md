---
'@_linked/auth': patch
---

Reference UserAccount and Person by class, so loading an auth shape registers them.

The shapes named them by `[package, name]`, which does not register anything. They
were registered only because `emitDecoratorMetadata` happened to keep the getter
return-type import alive in the tsc build; a consumer compiling the source with
esbuild (a localized checkout under Vite) emits no metadata, loses the import, and
queries traversing `account` or `credentialOf` throw `Shape class not found`.
