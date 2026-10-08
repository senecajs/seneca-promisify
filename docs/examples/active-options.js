// How-to: Disable individual decorations with the active options. On
// Seneca 3 the plugin skips the decorations that are turned off; on
// Seneca 4 the options have no effect because the methods belong to the
// core. See getting-started.js for the require conventions.
const Seneca = require(process.env.SENECA || 'seneca')
const Promisify = require('../..')

const seneca = Seneca({ log: 'warn' }).use(Promisify, {
  active: { message: false, prepare: false },
})

// The callback form of ready works on every version.
seneca.ready(function () {
  console.log('Seneca', this.version)
  for (const name of [
    'send',
    'post',
    'message',
    'prepare',
    'destroy',
    'prior',
    'ready',
  ]) {
    console.log(name + ':', typeof this[name])
  }
  this.close()
})
