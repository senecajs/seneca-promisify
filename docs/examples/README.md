# Examples

Runnable programs that accompany the [tutorial](../tutorials/getting-started.md)
and the how-to guides. Each file requires the plugin from this
repository (`require('../..')`) and chooses the Seneca module with the
`SENECA` environment variable; in your own project write
`require('seneca')` and `require('seneca-promisify')`.

| Program | Document |
| ------- | -------- |
| `getting-started.js` | [Getting started](../tutorials/getting-started.md) |
| `entities.js` | [Use promises with entities](../how-to/use-promises-with-entities.md) |
| `active-options.js` | [Disable individual decorations with the active options](../how-to/disable-decorations.md) |

Run an example from the repository root after `npm install`:

```sh
node docs/examples/getting-started.js                 # Seneca 4 prerelease (devDependency)
SENECA=seneca3 node docs/examples/getting-started.js  # Seneca 3 (devDependency alias seneca3)
```

On Seneca 3 the plugin decorates the instance; on Seneca 4 it is a
no-op and the same API comes from the core, so every program runs on
both and prints the same output apart from the version line.
