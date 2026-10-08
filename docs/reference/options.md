# Options

seneca-promisify has one option group, `active`, with a boolean flag
for each decoration it can add or replace. All flags default to `true`.
The options are read by `preload` on Seneca 3 only; on Seneca 4
`preload` returns before reading them, so they have no effect there
(see [Behaviour on Seneca 4](api.md#behaviour-on-seneca-4)).

## Setting options

With `use`:

```js
seneca.use('promisify', { active: { message: false } })
```

Or in the instance options, under `plugin`:

```js
Seneca({ plugin: { promisify: { active: { message: false } } } }).use('promisify')
```

The `active` object you give is merged over the defaults
(`{ ...defaults.active, ...options.active }`), so it only needs the
flags that change.

A top level `Seneca({ promisify: { ... } })` is rejected by the option
validation of Seneca 3.38 (`GubuError: ... the property "promisify" is
not allowed`). Seneca 4 does not read top level plugin options either.

## `active`

| Option | Type | Default | Effect when `false` |
| ------ | ---- | ------- | ------------------- |
| `active.post` | boolean | `true` | `seneca.post` is not added ([post](api.md#post)). |
| `active.message` | boolean | `true` | `seneca.message` is not added ([message](api.md#message)). `prepare` and `destroy` register their stages through `this.message`, so with `message` off a call to either of them throws `TypeError: this.message is not a function`. Turn `prepare` and `destroy` off as well. |
| `active.prepare` | boolean | `true` | `seneca.prepare` is not added ([prepare](api.md#prepare)). |
| `active.destroy` | boolean | `true` | `seneca.destroy` is not added ([destroy](api.md#destroy)). |
| `active.prior` | boolean | `true` | `prior` is not replaced: it stays the Seneca 3 core method, which takes a callback. Without a callback it submits the prior message fire-and-forget and returns `undefined` ([prior](api.md#prior)). |
| `active.ready` | boolean | `true` | `ready` is not replaced: it stays the Seneca 3 core method, which takes a callback and returns the instance, never a promise ([ready](api.md#ready)). |

Not configurable: `seneca.send` and the `seneca.__promisify$$` marker
are always added on Seneca 3.

## Defaults

```js
promisify.defaults = {
  active: {
    post: true,
    message: true,
    prepare: true,
    destroy: true,
    prior: true,
    ready: true,
  },
}
```

A worked example with its output is in
[Disable individual decorations with the active options](../how-to/disable-decorations.md).
