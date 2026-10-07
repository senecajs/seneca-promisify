# Disable individual decorations with the active options

How to stop seneca-promisify from adding or replacing a method on
Seneca 3, for example because your application or another plugin
already defines a method with that name. Every flag is described in
the [Options reference](../reference/options.md). The complete program
is [docs/examples/active-options.js](../examples/active-options.js).

## 1. Pass the flags

Each decoration has a boolean flag under `active`; all default to
`true`. Give only the flags you change, either with `use`:

```js
const seneca = Seneca({ log: 'warn' }).use('promisify', {
  active: { message: false, prepare: false },
})
```

or in the instance options under `plugin`:

```js
const seneca = Seneca({
  log: 'warn',
  plugin: { promisify: { active: { message: false, prepare: false } } },
}).use('promisify')
```

A top level `Seneca({ promisify: { ... } })` is rejected by the option
validation of Seneca 3.38 (`property "promisify" is not allowed`).

## 2. Know what remains

| Flag off | Result |
| -------- | ------ |
| `post` | `seneca.post` is undefined. |
| `message` | `seneca.message` is undefined. `prepare` and `destroy` are built on `message`, so calling either of them then throws `TypeError: this.message is not a function`; turn them off as well. |
| `prepare` | `seneca.prepare` is undefined. |
| `destroy` | `seneca.destroy` is undefined. |
| `prior` | `this.prior` is the Seneca 3 core method: callback only. Without a callback it submits the prior message fire-and-forget and returns `undefined`. |
| `ready` | `seneca.ready` is the Seneca 3 core method: callback only; it returns the instance, never a promise. |

`send` and the `__promisify$$` marker are always added.

## 3. Check the result

```js
seneca.ready(function () {
  for (const name of ['send', 'post', 'message', 'prepare', 'destroy', 'prior', 'ready']) {
    console.log(name + ':', typeof this[name])
  }
  this.close()
})
```

`SENECA=seneca3 node docs/examples/active-options.js` (Seneca 3.38.0):

```
Seneca 3.38.0
send: function
post: function
message: undefined
prepare: undefined
destroy: function
prior: function
ready: function
```

## 4. Seneca 4

On Seneca 4 the flags have no effect: `preload` returns before reading
them, and `post`, `message`, `prepare`, `destroy`, `prior` and `ready`
are core methods that cannot be removed by this plugin. `send` does not
exist there. `node docs/examples/active-options.js` (Seneca 4.0.0-rc5):

```
Seneca 4.0.0-rc5
send: undefined
post: function
message: function
prepare: function
destroy: function
prior: function
ready: function
```
