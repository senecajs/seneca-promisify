# Getting started

In this tutorial you write a small promise style plugin for Seneca 3
with seneca-promisify: an action written as an `async` function, a
message sent with `post`, asynchronous set up with `prepare`, an
override that calls `prior`, and clean up with `destroy`. It takes
about fifteen minutes. The finished program is
[docs/examples/getting-started.js](../examples/getting-started.js).

## 1. Install

Seneca 3 and the plugin, in a new directory:

```sh
npm init -y
npm install seneca@3 seneca-promisify
```

Node.js 18 or later is required. Seneca 4 does not need the plugin,
but the program below runs unchanged on Seneca 4 too: the plugin loads
and does nothing, and the core provides the same methods (see
[What Seneca 4 changed](../explanation/what-seneca-4-changed.md)).

## 2. Load the plugin

```js
const Seneca = require('seneca')

const seneca = Seneca({ log: 'warn' }).use('promisify')
```

`use('promisify')` loads `seneca-promisify` (Seneca adds the `seneca-`
prefix when it resolves a plugin name). The plugin decorates the
instance as soon as it is loaded: `message`, `post`, `prepare`,
`destroy` and `send` are added, `prior` and `ready` are replaced by
promise returning versions, and `seneca.__promisify$$` is `true`. Load
it before the plugins that use these methods.

## 3. Write the plugin

A Seneca plugin is a function; inside it `this` is the Seneca
instance. Create `shop.js`:

```js
function shop(options) {
  const seneca = this
  const prices = {}

  // Asynchronous initialization. The plugin is ready when it resolves.
  seneca.prepare(async function () {
    await new Promise((resolve) => setTimeout(resolve, 10)) // open a connection, load data, ...
    prices.apple = 1.5
    prices.pear = 2
  })

  // An action written as an async function: return the reply, throw on failure.
  seneca.message('role:shop,cmd:price', async function (msg) {
    const price = prices[msg.item]
    if (null == price) {
      throw new Error('unknown item: ' + msg.item)
    }
    return { item: msg.item, price }
  })

  // Actions send messages with post, inside this is the Seneca delegate.
  seneca.message('role:shop,cmd:total', async function (msg) {
    let total = 0
    for (const line of msg.lines) {
      const { price } = await this.post('role:shop,cmd:price', {
        item: line.item,
      })
      total += price * line.quantity
    }
    return { total }
  })

  // Asynchronous clean up, runs when the instance closes.
  seneca.destroy(async function () {
    console.log('shop: closing')
  })
}

module.exports = shop
```

Three decorations are at work:

* `prepare(asyncFn)` registers an initialization stage. Seneca runs it
  when the plugin is initialized and waits for the promise, so `ready`
  does not resolve before the prices are loaded. Several `prepare`
  calls form a chain in which the last registered runs first.
* `message(pattern, asyncFn)` adds an action written as an `async`
  function. The returned value is the reply; a thrown error, or a
  rejected promise, is an error reply. Inside the action `this` is a
  Seneca delegate bound to the current message, so `this.post` sends a
  child message.
* `destroy(asyncFn)` registers a clean up stage that runs when
  `seneca.close()` is called. Across plugins the stages run in reverse
  order of registration.

## 4. Use the plugin

Create `index.js`:

```js
const Seneca = require('seneca')
const shop = require('./shop')

async function main() {
  const seneca = Seneca({ log: 'warn' }).use('promisify').use(shop)

  // Resolves with the instance once every plugin has loaded.
  await seneca.ready()

  console.log(await seneca.post('role:shop,cmd:price,item:apple'))

  console.log(
    await seneca.post('role:shop,cmd:total', {
      lines: [
        { item: 'apple', quantity: 2 },
        { item: 'pear', quantity: 1 },
      ],
    }),
  )

  // Extend an action: the new action calls the original with prior.
  seneca.message('role:shop,cmd:price', async function (msg) {
    const out = await this.prior(msg)
    return { ...out, currency: 'EUR' }
  })

  console.log(await seneca.post('role:shop,cmd:price,item:pear'))

  // Runs the destroy functions, then the process can exit.
  await seneca.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

`post(msg)` submits the message and resolves with the reply; the
message can be a Jsonic string (`'role:shop,cmd:price,item:apple'`) or
an object, and a second argument is merged into it. Adding a second
action for an existing pattern makes the first one its *prior*; the
new action calls it with `this.prior(msg)` and extends the reply.

## 5. Run it

`node index.js` prints:

```
{ item: 'apple', price: 1.5 }
{ total: 5 }
{ item: 'pear', price: 2, currency: 'EUR' }
shop: closing
```

The program in [docs/examples/getting-started.js](../examples/getting-started.js)
is the same, with a first line that shows the Seneca version and
whether the plugin decorated the instance, and a last line after
`close`. Its real output with `SENECA=seneca3 node docs/examples/getting-started.js`
(Seneca 3.38.0 on Node.js 24):

```
Seneca 3.38.0 decorated by seneca-promisify: true
{ item: 'apple', price: 1.5 }
{ total: 5 }
{ item: 'pear', price: 2, currency: 'EUR' }
shop: closing
closed: true
```

With `node docs/examples/getting-started.js` (Seneca 4.0.0-rc5) only
the first line differs: `Seneca 4.0.0-rc5 decorated by seneca-promisify: false`.

What happened:

1. `use('promisify')` decorated the instance; `use(shop)` queued the
   plugin definition.
2. `await seneca.ready()` resolved once the `shop` plugin had been
   defined and its `prepare` stage had finished.
3. Each `post` ran the matching action and resolved with its return
   value. `role:shop,cmd:total` sent child messages with `this.post`.
4. The second `role:shop,cmd:price` action overrode the first and
   called it through `this.prior`.
5. `await seneca.close()` ran the `destroy` stage (`shop: closing`),
   closed the instance and let the process exit.

## 6. Errors

A thrown error rejects the `post`. Seneca 3 wraps action errors
(`legacy.error` is on by default): the rejection has `code`
`act_execute`, the message `seneca: Action cmd:price,role:shop failed: unknown item: kiwi.`
and the thrown error as `orig`. Seneca also logs the failure at level
`error`.

```js
try {
  await seneca.post('role:shop,cmd:price,item:kiwi')
} catch (err) {
  console.log(err.code) // act_execute
  console.log((err.orig || err).message) // unknown item: kiwi
}
```

On Seneca 4 the rejection is the original error (`err.message` is
`unknown item: kiwi`), so `(err.orig || err).message` works on both
versions.

## Next steps

* [Use promises with entities](../how-to/use-promises-with-entities.md)
  to store data with seneca-entity.
* [Disable individual decorations](../how-to/disable-decorations.md)
  when a method name is already taken.
* [Support Seneca 3 and Seneca 4 in one plugin](../how-to/support-seneca-3-and-4.md)
  if your code must run on both.
* The [API reference](../reference/api.md) describes each method
  precisely, including the callback forms that keep working.
