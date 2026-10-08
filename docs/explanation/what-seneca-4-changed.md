# What Seneca 4 changed

Seneca 4 made the promise API part of the core. This page lists what
moved into the core, what differs from the plugin, and what that means
for code that uses seneca-promisify.

## Built in

| Plugin on Seneca 3 | Seneca 4 core |
| ------------------ | ------------- |
| `seneca.message(pattern, asyncFn)` | Same, `seneca.message`. |
| `seneca.post(msg)` | Same, `seneca.post` (also `util.promisify(act)`). |
| `this.prepare(asyncFn)` | Same, on the plugin init pattern. |
| `this.destroy(asyncFn)` | Same shape, registered on `sys:seneca,cmd:close`. |
| `await this.prior(msg)` | Built in: `prior` without a callback behaves like `post`. |
| `await seneca.ready()` | Built in: resolves with the instance. |
| `await seneca.close()` | Already in the Seneca 3.38 core; unchanged. |
| `seneca.send(msg)` | Not in Seneca 4; use `seneca.act(msg)`. |
| `seneca.__promisify$$` | Not set. |
| `active` options | Not read. |
| (new) | `seneca.direct(msg)` runs an action synchronously. |

The core implementations of `message`, `prepare` and `destroy` have the
same shape as the plugin's functions: the plugin was the prototype of
the core feature.

## Differences in detail

* **Close pattern.** Seneca 4 closes through `sys:seneca,cmd:close`,
  and `destroy` stages are registered there. Hooks on the Seneca 3
  pattern `role:seneca,cmd:close` are never called in 4.0.0-rc5; 4.0.0
  calls them for compatibility. The plugin's own `destroy` would
  register on the old pattern, which is one reason it must not run on
  Seneca 4.
* **`ready(callback)`.** The core method returns the instance, so
  chaining works again. The promise form resolves with the instance on
  both versions. In 4.0.0-rc5 the promise never resolves when the
  instance is already idle (fixed in 4.0.0).
* **Errors.** Seneca 4 does not wrap action errors: `post` rejects with
  the thrown error itself, and the Seneca wrapper is attached as
  `err.meta$.err`. On Seneca 3 the rejection is the wrapper
  (`act_execute`), with the thrown error as `err.orig`.
* **Plugin options.** Seneca 4 reads plugin options from `use()` and
  `options.plugin.<name>` only.
* **Transitive dependencies.** Seneca 4 no longer depends on
  `optioner`, `@hapi/joi`, `norma`, `lodash` and other modules that
  Seneca 3 pulled in. Tests that required them, as this plugin's old
  test file did with `optioner`, fail to load until the `require` is
  removed or the module becomes a devDependency.
* **Node.js.** Seneca 4 requires Node.js 22 or later. The plugin itself
  runs on Node.js 18 or later with Seneca 3.

## What the plugin does on Seneca 4

Nothing, by design: `preload` returns before decorating anything, the
empty definition function runs, and `seneca.has_plugin('promisify')`
is `true`. Loading it is harmless, so code that supports both versions
can call `seneca.use('promisify')` unconditionally
(see [Support Seneca 3 and Seneca 4 in one plugin](../how-to/support-seneca-3-and-4.md)).

## When to remove it

As soon as Seneca 3 support is dropped.
[Migrate to the Seneca 4 built-in promise API](../how-to/migrate-to-seneca-4.md)
lists the few changes: `send` to `act`, error handling, the marker and
the `active` options.
