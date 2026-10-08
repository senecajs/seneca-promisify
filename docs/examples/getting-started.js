// Tutorial: Getting started. A promise style plugin on Seneca 3.
//
// In this repository the plugin is required from the source and the Seneca
// module is chosen with SENECA=seneca3 (Seneca 3, the plugin's target) or
// left as the default (the seneca 4 prerelease, where the plugin is a no-op
// because promises are built in). In your own project write:
//   const Seneca = require('seneca')
//   const Promisify = require('seneca-promisify')
const Seneca = require(process.env.SENECA || 'seneca')
const Promisify = require('../..')

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

async function main() {
  const seneca = Seneca({ log: 'warn' }).use(Promisify).use(shop)

  // Resolves with the instance once every plugin has loaded.
  await seneca.ready()
  console.log(
    'Seneca',
    seneca.version,
    'decorated by seneca-promisify:',
    true === seneca.__promisify$$,
  )

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
  console.log('closed:', seneca.flags.closed)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
