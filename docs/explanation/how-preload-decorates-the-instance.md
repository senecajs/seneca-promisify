# How preload decorates the root instance

## The preload hook

A Seneca plugin is a function, the *definition function*. Seneca calls
it with a plugin delegate as `this` as part of its plugin loading
sequence, after the plugins loaded earlier have finished defining
themselves. A plugin module can also export a `preload` function.
Seneca calls `preload` synchronously while `use` runs, before the
definition function and before any later plugin's definition. `this` is
the Seneca instance; the argument is the plugin record, with `name`,
`tag`, `options` and `defaults`. When a plugin has a `preload`, Seneca 3
resolves the plugin options before calling it, so `plugin.options` is
already the merge of the defaults and the options passed to `use`.

seneca-promisify does all of its work in `preload`; its definition
function is empty. The reason is timing. The plugins loaded after it
need `message`, `prepare` and `post` inside their own definition
functions, which run later in the loading sequence. `preload` is the
hook that runs early enough, and synchronously, so that the methods
exist as soon as `use('promisify')` returns.

## Decorating the root

Every Seneca instance has a `root` property that refers to the root
instance. Delegates, which are what `this` is inside actions and plugin
definitions, are derived from the root, so a property set on
`seneca.root` is visible on every delegate. The plugin assigns its
methods to `self.root` directly instead of using `seneca.decorate`,
because `decorate` refuses to replace an existing property, and `prior`
and `ready` exist already.

## Adding methods

* `send(msg)` is `this.act(msg)` followed by `return this`.
* `post` is `util.promisify(seneca.act)`. `util.promisify` passes
  `this` through, so `delegate.post(msg)` runs `act` on the delegate and
  the message carries the delegate's context: parent message, plugin,
  fixed arguments.
* `message` wraps the async function in an ordinary action:
  `actfunc.call(this, msg, meta).then(reply).catch(reply)`. Seneca reads
  validation rules and other metadata from properties of the action
  function, so the wrapper copies the function's own properties
  (`validate`, `handle`, ...) and its `name`. The copy is repeated on
  `setImmediate` to pick up properties assigned after the `message`
  call.

## Replacing methods

`prior` and `ready` already exist, so the plugin keeps references to
the originals in closure variables and installs async functions that
choose by the type of the last argument: a function means the callback
form, and the original is called; anything else means the promise form,
and `util.promisify` of the original is awaited. The promise form of
`ready` resolves with the instance, which allows
`const seneca = await Seneca().use(...).ready()`.

One consequence: because the wrappers are `async` functions, the
callback forms return promises too. `seneca.ready(cb)` resolves at once
with the instance instead of returning it, so chaining on `ready(cb)`
does not work while the plugin is loaded.

## prepare and destroy as actions

Plugin initialization in Seneca 3 is an action. After a plugin's
definition function has run, Seneca calls
`role:seneca,plugin:init,init:<name>` (with `tag:<tag>` for a tagged
plugin) and waits for the reply; `seneca.init(fn)` registers a callback
action on that pattern. `prepare(asyncFn)` registers an async action on
the same pattern with `message`, whose wrapper awaits the function and
then calls `this.prior(msg)`. Several stages are therefore priors of
each other, which gives the order "last registered runs first".

`destroy(asyncFn)` does the same on `role:seneca,cmd:close`, the action
that `seneca.close()` runs in Seneca 3. Since every `destroy` stage
becomes the prior of the next one registered, close stages run in
reverse order across all plugins: the plugin loaded last cleans up
first, which matches the dependency order of most applications.

Both functions record the stage on the plugin record
(`this.plugin.prepare`, `this.plugin.destroy`) and need `this.plugin`,
so they are called inside definition functions. Both use `message`, so
`active.message` must stay on when they are used.

## The marker and the version check

`seneca.__promisify$$ = true` is the last assignment in `preload`: code
can check it to know that the decorations exist. The first statement is
the version check, `if (!self.version.startsWith('3.')) return`: on
Seneca 4 none of the above happens, and the core provides the methods
(see [What Seneca 4 changed](what-seneca-4-changed.md)).
