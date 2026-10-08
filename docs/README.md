# seneca-promisify documentation

The documentation follows the [Diátaxis](https://diataxis.fr/)
structure: four sections with four different jobs. Start with the
tutorial if you are new to the plugin; use the how-to guides for
specific tasks; look things up in the reference; read the explanations
to understand the design.

seneca-promisify adds a Promise based API to Seneca 3. On Seneca 4 the
same API is part of the core and the plugin does nothing; the pages
below say what applies to which version.

## Tutorials

Learning oriented lessons that take you through building something,
step by step.

| Tutorial | What you build |
| -------- | -------------- |
| [Getting started](tutorials/getting-started.md) | A promise style plugin on Seneca 3: `prepare`, `message`, `post`, `prior`, `destroy`, `ready` and `close`. |

The programs from the tutorial and the how-to guides are in
[examples](examples/README.md).

## How-to guides

Task oriented recipes for people who already know the basics.

| Guide | Covers |
| ----- | ------ |
| [Use promises with entities](how-to/use-promises-with-entities.md) | seneca-entity with `async`/`await` on Seneca 3, in actions and in `prepare`. |
| [Disable individual decorations with the active options](how-to/disable-decorations.md) | Turning off `post`, `message`, `prepare`, `destroy`, `prior` or `ready`, and what remains. |
| [Support Seneca 3 and Seneca 4 in one plugin](how-to/support-seneca-3-and-4.md) | Peer ranges, `send` versus `act`, errors, close hooks, `ready`, testing both versions. |
| [Migrate to the Seneca 4 built-in promise API](how-to/migrate-to-seneca-4.md) | Removing the plugin, what to change, what stays the same. |

## Reference

Information oriented descriptions of every part of the plugin.

| Reference | Describes |
| --------- | --------- |
| [API](reference/api.md) | Loading the plugin, every method it adds or replaces, the `__promisify$$` marker, behaviour on Seneca 4, errors. |
| [Options](reference/options.md) | Every `active.*` flag with its default and effect. |

## Explanation

Understanding oriented discussions of how the plugin works and why.

| Explanation | Topic |
| ----------- | ----- |
| [Why an interim plugin](explanation/why-an-interim-plugin.md) | The callback API of Seneca 3, why a plugin rather than a core change, what the plugin does not do. |
| [How preload decorates the root instance](explanation/how-preload-decorates-the-instance.md) | The `preload` hook, decorating `seneca.root`, wrapping `prior` and `ready`, `prepare` and `destroy` as actions. |
| [What Seneca 4 changed](explanation/what-seneca-4-changed.md) | The built-in promise API, the differences from the plugin, when to remove it. |

## Feature index

Every option, decoration, action pattern, export and error code of the
plugin, with the page that documents it. The plugin defines no actions
of its own, no exports, no error codes and no command line flags.

| Feature | Kind | Documented in |
| ------- | ---- | ------------- |
| `active.post` | option | [Options: active](reference/options.md#active) |
| `active.message` | option | [Options: active](reference/options.md#active) |
| `active.prepare` | option | [Options: active](reference/options.md#active) |
| `active.destroy` | option | [Options: active](reference/options.md#active) |
| `active.prior` | option | [Options: active](reference/options.md#active) |
| `active.ready` | option | [Options: active](reference/options.md#active) |
| `seneca.send` | decoration, always added | [API: send](reference/api.md#send) |
| `seneca.post` | decoration | [API: post](reference/api.md#post) |
| `seneca.message` | decoration | [API: message](reference/api.md#message) |
| `seneca.prepare` | decoration | [API: prepare](reference/api.md#prepare) |
| `seneca.destroy` | decoration | [API: destroy](reference/api.md#destroy) |
| `seneca.prior` | core method replaced | [API: prior](reference/api.md#prior) |
| `seneca.ready` | core method replaced | [API: ready](reference/api.md#ready) |
| `seneca.__promisify$$` | marker, always added | [API: Marker](reference/api.md#marker) |
| `role:seneca,plugin:init,init:<name>[,tag:<tag>]` | action pattern registered by `prepare` | [API: prepare](reference/api.md#prepare) |
| `role:seneca,cmd:close` | action pattern registered by `destroy` | [API: destroy](reference/api.md#destroy) |
| `preload`, `defaults` | plugin definition hooks | [API: Plugin definition](reference/api.md#plugin-definition) |
| Version check | `preload` returns early on Seneca 4 | [API: Behaviour on Seneca 4](reference/api.md#behaviour-on-seneca-4) |
| Exports | none | [API: Plugin definition](reference/api.md#plugin-definition) |
| Error codes | none | [API: Errors](reference/api.md#errors) |

## Other documents

* [Change log](../CHANGES.md)
* [License](../LICENSE)
