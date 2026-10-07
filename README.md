# seneca-promisify

[Seneca](https://senecajs.org) plugin that adds a Promise based API to
Seneca 3: `message` for actions written as `async` functions, `post` to
send a message and await the reply, `prepare` and `destroy` for
asynchronous plugin set up and clean up, and promise returning `prior`
and `ready`. Seneca 4 has all of this built in, so on Seneca 4 the
plugin loads and does nothing. Keep it only in code that must also run
on Seneca 3.

[![Npm][BadgeNpm]][Npm]
[![Build][BadgeBuild]][Build]

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install seneca-promisify
```

The plugin has no dependencies of its own. `seneca` is a peer
dependency (`>=3 || >=4.0.0-rc2`). Node.js 18 or later is required;
the tests run on Node.js 24 and 22.

## Quick Example

```js
const Seneca = require('seneca')

async function main() {
  const seneca = Seneca({ log: 'warn' }).use('promisify')

  // An action written as an async function: return the reply.
  seneca.message('role:shop,cmd:price', async function (msg) {
    return { item: msg.item, price: 1.5 }
  })

  // Send a message and await the reply.
  const out = await seneca.post('role:shop,cmd:price,item:apple')
  console.log(out) // { item: 'apple', price: 1.5 }

  await seneca.close()
}

main()
```

## More Examples

* [Getting started](docs/tutorials/getting-started.md): a promise style
  plugin with `prepare`, `message`, `post`, `prior` and `destroy`. The
  program is [docs/examples/getting-started.js](docs/examples/getting-started.js).
* [Use promises with entities](docs/how-to/use-promises-with-entities.md)
* [Disable individual decorations with the active options](docs/how-to/disable-decorations.md)
* [Support Seneca 3 and Seneca 4 in one plugin](docs/how-to/support-seneca-3-and-4.md)
* [Migrate to the Seneca 4 built-in promise API](docs/how-to/migrate-to-seneca-4.md)
* All runnable programs: [docs/examples](docs/examples/README.md).

The full documentation index is [docs/README.md](docs/README.md).

## Motivation

Seneca 3 has a callback API: actions reply by calling a function, and
`act`, `ready` and `prior` take callbacks. This plugin was written as an
interim step so that applications and plugins could use `async`/`await`
without changing the Seneca 3 core, and so that the API could prove
itself before it became part of Seneca 4. See
[Why an interim plugin](docs/explanation/why-an-interim-plugin.md) and
[What Seneca 4 changed](docs/explanation/what-seneca-4-changed.md).

## Support

* Questions and bug reports: [GitHub issues](https://github.com/senecajs/seneca-promisify/issues).
* Seneca documentation: [senecajs.org](https://senecajs.org) and the
  [Seneca 4 documentation](https://github.com/senecajs/seneca/blob/master/docs/README.md).
* Commercial support: [Voxgig](https://www.voxgig.com).

## API

Decorations added on Seneca 3. Details, including the exact promise
and callback behaviour of each method, are in the
[API reference](docs/reference/api.md).

| Method | Purpose | Controlled by |
| ------ | ------- | ------------- |
| [`seneca.send(msg)`](docs/reference/api.md#send) | Fire-and-forget message; returns the instance. | always added |
| [`seneca.post(msg, [moreProps])`](docs/reference/api.md#post) | Promise form of `act`. | `active.post` |
| [`seneca.message(pattern, [moreProps], [asyncFn])`](docs/reference/api.md#message) | Add an action written as an async function. | `active.message` |
| [`seneca.prepare(asyncFn)`](docs/reference/api.md#prepare) | Asynchronous plugin initialization. | `active.prepare` |
| [`seneca.destroy(asyncFn)`](docs/reference/api.md#destroy) | Asynchronous plugin clean up on close. | `active.destroy` |
| [`this.prior(msg)`](docs/reference/api.md#prior) | Promise form of `prior`; the callback form still works. | `active.prior` |
| [`seneca.ready()`](docs/reference/api.md#ready) | Promise form of `ready`; resolves with the instance. | `active.ready` |
| [`seneca.__promisify$$`](docs/reference/api.md#marker) | `true` when the instance was decorated. | always added |

| Options | Default | Reference |
| ------- | ------- | --------- |
| `active.post`, `active.message`, `active.prepare`, `active.destroy`, `active.prior`, `active.ready` | all `true` | [Options](docs/reference/options.md) |

On Seneca 4 nothing is decorated and the options have no effect; see
[Behaviour on Seneca 4](docs/reference/api.md#behaviour-on-seneca-4).

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open
participation. If you feel you can help in any way, be it with
documentation, examples, extra testing, or new features, please get in
touch.

The test suite runs against the Seneca 4 prerelease (devDependency
`seneca@^4.0.0-rc5`), where the plugin is a no-op, and against Seneca 3
(`seneca3`, an npm alias of `seneca@3`), where it decorates the
instance. Node.js 24 is the default target, Node.js 22 is also tested.

```sh
npm install
npm test
```

To test against an unreleased Seneca build, install its tarball without
saving it, then restore the prerelease:

```sh
npm install --no-save /path/to/seneca-4.0.0.tgz && npm test
npm install
```

The examples run on either version:

```sh
node docs/examples/getting-started.js                 # Seneca 4 prerelease
SENECA=seneca3 node docs/examples/getting-started.js  # Seneca 3
```

Format code with `npm run prettier`. The continuous integration
workflow is delivered as a patch in [.patches](.patches/README.md)
(`git am .patches/*.patch`), because workflow files need a GitHub
`workflow` scope that the preparing session did not have.

## Background

seneca-promisify was first published in 2018 by [Voxgig](https://www.voxgig.com)
as an interim Promise based API for Seneca 3. Earlier versions also
promisified entity methods; since seneca-entity 18 the entity plugin
does this itself and seneca-promisify no longer touches entities. In
2026 the API became part of Seneca 4, and the plugin became a no-op
there. Changes between versions are listed in [CHANGES.md](CHANGES.md).

| Seneca | Plugin behaviour | Node.js |
| ------ | ---------------- | ------- |
| 3.x (tested with 3.38) | Decorates the instance with the promise API. | 18 or later (tested on 22 and 24) |
| 4.0.0-rc5 and 4.0.0 | Loads and does nothing; the core provides the API. | 22 or later (a Seneca 4 requirement) |

Licensed under [MIT](LICENSE).

[BadgeNpm]: https://badge.fury.io/js/seneca-promisify.svg
[Npm]: https://www.npmjs.com/package/seneca-promisify
[BadgeBuild]: https://github.com/senecajs/seneca-promisify/actions/workflows/build.yml/badge.svg
[Build]: https://github.com/senecajs/seneca-promisify/actions/workflows/build.yml
