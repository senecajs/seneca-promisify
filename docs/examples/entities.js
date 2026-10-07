// How-to: Use promises with entities. seneca-entity provides the promise
// forms of save$, load$, list$ and remove$ itself; seneca-promisify adds
// the promise API of the instance (message, post, prepare, ready) on
// Seneca 3. See getting-started.js for the require conventions.
const Seneca = require(process.env.SENECA || 'seneca')
const Promisify = require('../..')

async function main() {
  // 'entity' loads seneca-entity, with its in-memory store.
  const seneca = Seneca({ log: 'warn' }).use(Promisify).use('entity')
  await seneca.ready()

  const apple = await seneca
    .entity('shop/item')
    .data$({ name: 'apple', price: 1.5 })
    .save$()
  console.log('saved:', apple.name, apple.price, 'id is a', typeof apple.id)

  const loaded = await seneca.entity('shop/item').load$(apple.id)
  console.log('loaded:', loaded.name, loaded.price)

  await seneca.entity('shop/item').data$({ name: 'pear', price: 2 }).save$()
  const items = await seneca.entity('shop/item').list$({})
  console.log('items:', items.map((item) => item.name).sort())

  await apple.remove$()
  console.log(
    'after remove:',
    (await seneca.entity('shop/item').list$()).length,
  )

  // Entities inside an async action: this.entity uses the action's delegate.
  seneca.message('role:shop,cmd:stock', async function (msg) {
    const list = await this.entity('shop/item').list$({ name: msg.name })
    return { name: msg.name, count: list.length }
  })

  console.log(await seneca.post('role:shop,cmd:stock,name:pear'))
  console.log(await seneca.post('role:shop,cmd:stock,name:apple'))

  await seneca.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
