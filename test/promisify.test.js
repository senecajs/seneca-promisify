/* Copyright (c) 2018-2026 voxgig and other contributors, MIT License */
'use strict'

// Seneca 4 run: the plugin loads and is a no-op, the promise API comes
// from the core. The behavioural tests are shared with the Seneca 3 run
// in promisify3.test.js.

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const PluginValidator = require('seneca-plugin-validator')
const Seneca = require('seneca')

const Plugin = require('..')
const behaviour = require('./behaviour')

lab.test('validate', PluginValidator(Plugin, module))

behaviour(lab, { Seneca, major: 4 })

lab.test('seneca4-noop', async () => {
  var si = Seneca()
    .test()
    .use(Plugin, { active: { post: false, message: false } })

  // Callback form: on 4.0.0-rc5 `await si.ready()` on an idle instance
  // does not resolve.
  await new Promise((resolve) => si.ready(resolve))

  // Nothing was decorated: no marker, no `send`, options have no effect.
  expect(si.__promisify$$).to.not.exist()
  expect(si.send).to.not.exist()
  expect(si.post).function()
  expect(si.message).function()
  expect(si.prepare).function()
  expect(si.destroy).function()

  // The core promise API works as usual.
  si.message('a:1', async function (msg) {
    return { x: msg.x }
  })
  expect(await si.post('a:1,x:1')).equal({ x: 1 })

  await si.close()
  expect(si.flags.closed).true()
})
