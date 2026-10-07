/* Copyright (c) 2018-2026 voxgig and other contributors, MIT License */
'use strict'

// Seneca 3 run: the plugin decorates the instance with the promise API.
// `seneca3` is an npm alias for seneca@3 (see package.json).

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const Seneca = require('seneca3')

const Plugin = require('..')
const behaviour = require('./behaviour')

behaviour(lab, { Seneca, major: 3 })

lab.test('seneca3-decorations', async () => {
  var si = Seneca().test().use(Plugin)

  expect(si.__promisify$$).true()
  expect(si.send).function()
  expect(si.post).function()
  expect(si.message).function()
  expect(si.prepare).function()
  expect(si.destroy).function()

  // `ready` with a callback still calls back, but the wrapper is an
  // async function, so the return value is a Promise, not the instance.
  var called = false
  var out = si.ready(function () {
    called = true
  })
  expect(out === si).false()
  expect(out.then).function()
  expect((await out) === si).true()

  await new Promise((resolve) => si.ready(resolve))
  expect(called).true()

  await si.close()
})

lab.test('seneca3-actives-all-off', async () => {
  var si = Seneca()
    .test()
    .use(Plugin, {
      active: {
        post: false,
        message: false,
        prepare: false,
        destroy: false,
        prior: false,
        ready: false,
      },
    })

  expect(si.post).to.not.exist()
  expect(si.message).to.not.exist()
  expect(si.prepare).to.not.exist()
  expect(si.destroy).to.not.exist()

  // `ready` and `prior` stay the core callback methods: `ready` returns
  // the instance, not a Promise.
  expect(si.ready() === si).true()
  expect(si.ready(function () {}) === si).true()

  // `send` and the marker are always added.
  expect(si.send).function()
  expect(si.__promisify$$).true()

  await new Promise((resolve) => si.ready(resolve))
  await si.close()
})
