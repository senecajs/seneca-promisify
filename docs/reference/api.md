# API

Everything seneca-promisify adds to a Seneca 3 instance, and what it
does on Seneca 4. The plugin's name is `promisify`. It adds no action
patterns of its own, has no exports and defines no error codes.

## Loading the plugin

```js
seneca.use('promisify')                      // resolves the seneca-promisify module
seneca.use(require('seneca-promisify'))      // or pass the module
seneca.use('promisify', { active: { ... } }) // with options, see Options
```

The decorations are added synchronously while `use` runs, by the
plugin's `preload` hook, so they exist as soon as `use` returns and
are available to every plugin loaded afterwards. Load seneca-promisify
before the plugins that use its methods. Loading it twice wraps
`prior` and `ready` a second time; this works but is unnecessary.

Options are described in [Options](options.md).

## Plugin definition

| Member | Value |
| ------ | ----- |
| `promisify(options)` | The definition function. It is empty: all work is done in `preload`. |
| `promisify.preload(plugin)` | Called by Seneca with the root instance as `this` and the plugin record (`name`, `tag`, `options`, `defaults`) as argument, before the definition function. Returns at once when `seneca.version` does not start with `3.`. Otherwise it merges `plugin.defaults.active` and `plugin.options.active` and decorates `seneca.root` as described below. |
| `promisify.defaults` | `{ active: { post: true, message: true, prepare: true, destroy: true, prior: true, ready: true } }`. |
| Exports | None. |
| Actions | None of its own. `prepare` and `destroy` register actions on behalf of the plugin that calls them. |
| Errors | None, see [Errors](#errors). |

## Decorations

All decorations are set on the root instance and are therefore also
available on delegates, such as `this` inside an action or a plugin
definition function.

### `send`

```js
seneca.send(msg) // returns the instance
```

Submit a message without waiting for a reply: `seneca.act(msg)` with no
callback. Errors are logged and passed to the error handler, as for
`act`. Always added; not controlled by an option. Seneca 4 has no
`send`; use `seneca.act(msg)` there.

### `post`

```js
const result = await seneca.post(msg, [moreProps])
```

Promise form of `act`, created with `util.promisify(seneca.act)`.
`moreProps` is merged into the message as with `act`. Resolves with the
reply and rejects with the error. The reply meta data is not available
through `post`; use `act` with a callback when you need it.

On Seneca 3 with the default `legacy.error` setting, the rejection is
the Seneca wrapper of the action error: `code` is `act_execute`,
`message` is `seneca: Action <pattern> failed: <message>.` and the
thrown error is `orig`.

Controlled by `active.post`.

### `message`

```js
seneca.message(pattern, [moreProps], [action]) // returns the instance
```

Add an action written as an `async function (msg, meta)`. `pattern` and
`moreProps` are passed to `seneca.add` unchanged (Jsonic string or
object). The action is wrapped: the resolved value becomes the reply, a
rejection (a thrown error) becomes the error reply. Inside the action
`this` is the action delegate, with `post`, `prior` and the rest of the
API. Return or throw; there is no `reply` parameter.

The wrapper keeps the function's `name`. The function's own enumerable
properties, such as `validate` and `handle`, are copied to the wrapper
so that Seneca sees them on the action. They are copied again on the
next `setImmediate`, so properties assigned right after the `message`
call are included too.

Without an action, `message(pattern)` is `seneca.add(pattern)`: a
placeholder action that replies with the message's `default$` value or
`null`.

Controlled by `active.message`. `prepare` and `destroy` depend on it.

### `prepare`

```js
this.prepare(async function (msg) { ... }) // inside a plugin definition; returns the instance
```

Register an asynchronous initialization stage for the current plugin.
The stage is an action, added with `message`, on the plugin's init
pattern `role:seneca,plugin:init,init:<plugin name>`, plus `tag:<tag>`
when the plugin was loaded with a tag. Seneca calls this pattern once
after the definition function has run, and the plugin is not ready
until the stage has replied. An error thrown by the stage fails the
plugin's initialization.

The wrapper awaits the function and then calls `this.prior(msg)`, so
several `prepare` calls in one plugin form a prior chain in which the
last registered stage runs first. The wrapper is named
`prepare_<function name>`, and the function is appended to
`this.plugin.prepare`, an array on the plugin record.

`prepare` must be called inside a plugin definition function, where
`this.plugin` is the plugin record. Controlled by `active.prepare`;
requires `active.message`.

### `destroy`

```js
this.destroy(async function (msg) { ... }) // inside a plugin definition; returns the instance
```

Register an asynchronous clean up stage. The stage is an action, added
with `message`, on `role:seneca,cmd:close`, the pattern Seneca 3 calls
from `seneca.close()`. The wrapper awaits the function and then calls
`this.prior(msg)`, so stages run in reverse order of registration,
across all plugins: the stage registered last runs first. The wrapper
is named `destroy_<function name>`, and the function is appended to
`this.plugin.destroy`.

`destroy` must be called inside a plugin definition function.
Controlled by `active.destroy`; requires `active.message`. On Seneca 4
the core `destroy` registers on `sys:seneca,cmd:close` instead.

### `prior`

```js
const result = await this.prior(msg) // promise form
this.prior(msg, reply)               // callback form
```

Replaces the core `prior` with an async function. Without a callback it
awaits the promisified core `prior` and resolves with the prior
action's reply; when the action has no prior, it resolves with the
message's `default$` value or `null`. With a function as the last of
two or more arguments it calls the core `prior` with that callback; the
return value is then a promise as well (an `async` function always
returns one) that resolves with the core method's return value, not
with the reply. Errors from the core, such as `no_prior_action` when
called outside an action, reject the promise.

Controlled by `active.prior`.

### `ready`

```js
const instance = await seneca.ready() // promise form
seneca.ready(function () { ... })     // callback form
```

Replaces the core `ready` with an async function. Without a callback it
waits until the instance is idle, which includes the completion of all
plugins loaded so far and their `prepare` stages, and resolves with the
instance. With a callback it calls the core `ready`, which invokes the
callback when the instance is idle; the return value, however, is a
promise that resolves at once with the instance, not the instance
itself. Chaining such as `seneca.ready(cb).use(...)` therefore does not
work while the plugin is loaded; call `use` first, or use the promise
form.

Controlled by `active.ready`.

### Marker

```js
if (true === seneca.__promisify$$) { ... } // the marker property
```

Set to `true` on the root instance at the end of `preload` on Seneca 3,
after all decorations. `undefined` on Seneca 4 and before the plugin is
loaded. Always set on Seneca 3; not controlled by an option.

## Not changed

`seneca.close()` is not touched: Seneca 3.38 already returns a promise
from `close()` when it is called without a callback. `add`, `act`,
`use`, `sub` and the rest of the instance API are unchanged. Entity
methods are not promisified by this plugin; seneca-entity does that
itself (see [Use promises with entities](../how-to/use-promises-with-entities.md)).

## Behaviour on Seneca 4

`preload` checks `seneca.version`. When it does not start with `3.`
(Seneca 4.0.0-rc5, 4.0.0 and later), the hook returns immediately:

* Nothing is decorated, and the `active` options are not read.
* `seneca.__promisify$$` is `undefined` and `seneca.send` does not
  exist.
* `message`, `post`, `prepare`, `destroy`, `prior`, `ready` and `close`
  are the Seneca 4 core methods. The differences from the plugin are
  listed in [What Seneca 4 changed](../explanation/what-seneca-4-changed.md):
  `destroy` registers on `sys:seneca,cmd:close`, `ready(callback)`
  returns the instance, action errors are not wrapped.
* The plugin is still registered: `seneca.has_plugin('promisify')` is
  `true`, and its empty definition function runs.
* In Seneca 4.0.0-rc5, `await seneca.ready()` on an idle instance never
  resolves (fixed in 4.0.0). Use `seneca.ready(callback)` in code that
  may run on rc5.

## Errors

The plugin defines no error codes (`promisify.errors` is not set). The
file `lib/errors.js` in the package is an unused placeholder from the
plugin template and is never loaded. Errors seen while using the plugin
come from Seneca itself: wrapped action errors (`act_execute`) from
`post`, `no_prior_action` from `prior` outside an action, and the
`TypeError` described in [Options](options.md#active) when `prepare` or
`destroy` is called with `active.message` off.
