# Use promises with entities

How to use [seneca-entity](https://github.com/senecajs/seneca-entity)
with `async`/`await` on Seneca 3 together with seneca-promisify. The
complete program is [docs/examples/entities.js](../examples/entities.js).

seneca-entity (version 18 and later) provides the promise forms of the
entity methods itself. seneca-promisify is not needed for `save$` or
`list$`; it is needed for the instance API around them (`message`,
`post`, `prepare`, `ready`) on Seneca 3. On Seneca 4 all of it is
built in.

## 1. Install and load

```sh
npm install seneca@3 seneca-promisify seneca-entity
```

Load seneca-promisify first, then the entity plugin. Without a store
plugin, seneca-entity uses its in-memory store.

```js
const Seneca = require('seneca')

const seneca = Seneca({ log: 'warn' }).use('promisify').use('entity')
await seneca.ready()
```

## 2. Create entities in promise mode

`seneca.entity(name)` creates an entity whose methods return promises
when called without a callback. `seneca.make(name)` creates one in
callback mode: its methods take a callback and return the entity, not
a promise. Use `entity` with `await`:

```js
const apple = await seneca.entity('shop/item').data$({ name: 'apple', price: 1.5 }).save$()

const loaded = await seneca.entity('shop/item').load$(apple.id)

await seneca.entity('shop/item').data$({ name: 'pear', price: 2 }).save$()
const items = await seneca.entity('shop/item').list$({})

await apple.remove$()
```

`data$` and `clone$` are synchronous and can be chained; `save$`,
`load$`, `list$` and `remove$` return promises.

## 3. Use entities inside actions

Inside an action written with `message`, `this` is the action's
delegate, and `this.entity` creates entities bound to it:

```js
seneca.message('role:shop,cmd:stock', async function (msg) {
  const list = await this.entity('shop/item').list$({ name: msg.name })
  return { name: msg.name, count: list.length }
})

console.log(await seneca.post('role:shop,cmd:stock,name:pear')) // { name: 'pear', count: 1 }
```

## 4. Seed data in prepare

A `prepare` stage runs before the plugin is ready, so data saved there
is available to the first message:

```js
seneca.use(function catalogue() {
  this.prepare(async function () {
    await this.entity('shop/item').data$({ name: 'apple', price: 1.5 }).save$()
  })
})

await seneca.ready()
```

## 5. Run the example

```sh
SENECA=seneca3 node docs/examples/entities.js   # Seneca 3
node docs/examples/entities.js                  # Seneca 4 prerelease
```

Both print:

```
saved: apple 1.5 id is a string
loaded: apple 1.5
items: [ 'apple', 'pear' ]
after remove: 1
{ name: 'pear', count: 1 }
{ name: 'apple', count: 0 }
```
