# Why an interim plugin

## The callback API of Seneca 3

Seneca 3 is built on callbacks. An action replies by calling a
function: `seneca.add(pattern, function (msg, reply) { reply(null, result) })`.
Messages are sent with `seneca.act(msg, function (err, result) { ... })`,
start up is awaited with `seneca.ready(function () { ... })`, and the
prior action is called with `this.prior(msg, reply)`. That was the
idiom of Node.js when Seneca was designed.

When `async`/`await` arrived, writing Seneca code this way became
awkward. Every `act` had to be wrapped with `util.promisify`, every
action had to translate `return` and `throw` into `reply` calls, and
plugin initialization (`seneca.init`) and close hooks stayed callback
based. None of the promise forms is hard to write, but they are
repetitive, and every project wrote its own.

## Why a plugin and not a core change

Changing the Seneca 3 core would have meant a new API surface in a
stable major version used in production, with compatibility to
maintain across many 3.x releases. A plugin could instead:

* ship independently and be adopted project by project;
* stay small enough to read in one sitting (promisify.js is under two
  hundred lines);
* be switched off per decoration (the `active` options) where a method
  name clashed with existing code;
* be removed again without touching the core.

The plugin was called interim from the start: it was a way to prove
the shape of the API in real use before making it part of Seneca. That
happened with Seneca 4, whose `message`, `prepare` and `destroy` have
the same shape as the plugin's functions, with the close pattern
changed to `sys:seneca,cmd:close`.

## What the plugin does not do

* It does not change how Seneca runs actions. `message` produces an
  ordinary callback action, and `post` is `util.promisify(act)`.
  Patterns, priors, meta data, timeouts and transports are unchanged.
* It does not wrap `close`: Seneca 3.38 already returns a promise from
  `close()` when called without a callback.
* It does not promisify entities. Early versions did; since
  seneca-entity 18 the entity plugin has its own promise mode
  (`seneca.entity(...)`), and the two plugins no longer overlap.
* It does not hide the error wrapping of Seneca 3. `post` rejects with
  the same error object a callback would receive: `code` `act_execute`,
  the original error as `orig`.

## Why it is a no-op on Seneca 4

With the API in the core, a plugin that decorated the instance again
would at best be redundant and at worst break the core methods, for
example by registering `destroy` stages on the Seneca 3 close pattern,
which Seneca 4.0.0-rc5 never calls. So `preload` checks the version and
returns. The plugin remains useful in one case: code that supports
Seneca 3 and Seneca 4 at the same time can load it unconditionally.
Once Seneca 3 support is dropped, the dependency can go; see
[Migrate to the Seneca 4 built-in promise API](../how-to/migrate-to-seneca-4.md).
