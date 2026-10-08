# Support Seneca 3 and Seneca 4 in one plugin

How to write a plugin, or an application, that runs on Seneca 3 with
seneca-promisify and on Seneca 4 with the built-in promise API. This
repository follows these steps itself: its test suite runs against
both versions.

## 1. Declare both versions

Keep the peer dependency range open to the Seneca 4 prerelease. A bare
`>=3` excludes prereleases and makes `npm install` fail with
`ERESOLVE` when `seneca@4.0.0-rc5` is installed:

```json
"peerDependencies": {
  "seneca": ">=3 || >=4.0.0-rc5"
}
```

An existing `>=3||>=4.0.0-rc2` can stay as it is.

## 2. Always load the plugin

```js
seneca.use('promisify')
```

On Seneca 3 this adds the promise API. On Seneca 4 the plugin loads
and returns at once, so loading it is harmless. Load it before the
plugins that use `message`, `post`, `prepare` or `destroy`.

## 3. Use act, not send

`seneca.send(msg)` exists only on Seneca 3 with the plugin. Fire-and-
forget messages work on both versions with `act` and no callback:

```js
seneca.act('role:shop,cmd:log', { item: 'apple' })
```

## 4. Read errors the same way on both

Seneca 3 wraps an action error (`legacy.error` defaults to `true`): the
rejection of `post` has the Seneca message and the thrown error as
`err.orig`. Seneca 4 rejects with the original error. Use:

```js
try {
  await seneca.post('role:shop,cmd:price,item:kiwi')
} catch (err) {
  const message = (err.orig || err).message
}
```

## 5. Release resources with destroy

`this.destroy(asyncFn)` registers a close stage on both versions: the
plugin provides it on Seneca 3 (on the `role:seneca,cmd:close` action)
and the core on Seneca 4 (on `sys:seneca,cmd:close`).

```js
this.destroy(async function () {
  await connection.end()
})
```

If you register a close hook on a pattern directly instead, choose the
pattern by version. In Seneca 4.0.0-rc5 hooks on `role:seneca,cmd:close`
are never called (4.0.0 calls them for compatibility):

```js
// Seneca 3 closes via role:seneca,cmd:close; Seneca 4 via sys:seneca,cmd:close.
const close_pattern = seneca.version.startsWith('3.')
  ? 'role:seneca,cmd:close'
  : 'sys:seneca,cmd:close'
seneca.add(close_pattern, function (msg, reply) {
  // release resources, then continue the chain
  this.prior(msg, reply)
})
```

## 6. Wait for ready carefully

`await seneca.ready()` works on both versions right after `use`, when
the instance is still loading plugins. On Seneca 4.0.0-rc5 the promise
never resolves when the instance is already idle (fixed in 4.0.0). In
test harness code that may run on rc5, or whenever the instance may be
idle, use the callback form, which works everywhere:

```js
await new Promise((resolve) => seneca.ready(resolve))
```

Do not chain on `seneca.ready(callback)`: on Seneca 3 with the plugin
it returns a promise, not the instance (see [ready](../reference/api.md#ready)).

## 7. Pass plugin options through use

Seneca 4 reads plugin options only from `use(name, options)` and from
`options.plugin.<name>`. Seneca 3.38 rejects top level
`options.<pluginname>` for this plugin as well, so always write:

```js
seneca.use('promisify', { active: { message: false } })
```

## 8. Test against both versions

Install Seneca 3 under an alias next to the Seneca 4 devDependency:

```json
"devDependencies": {
  "seneca": "^4.0.0-rc5",
  "seneca3": "npm:seneca@^3.38.0"
}
```

Put the behavioural tests in a module that takes the Seneca module as
a parameter, and run it twice:

```js
// test/behaviour.js
module.exports = function behaviour(lab, spec) {
  const Seneca = spec.Seneca
  const decorates = 3 === spec.major
  lab.test('post', async () => {
    const si = Seneca().test().use(require('..'))
    si.message('a:1', async (msg) => ({ x: msg.x }))
    expect(await si.post('a:1,x:1')).equal({ x: 1 })
    expect(si.__promisify$$).equal(decorates ? true : undefined)
    await si.close()
  })
}

// test/promisify.test.js
behaviour(lab, { Seneca: require('seneca'), major: 4 })

// test/promisify3.test.js
behaviour(lab, { Seneca: require('seneca3'), major: 3 })
```

Seneca 3.38 runs on Node.js 22 and 24 (its `eraro` dependency, 3.1.1,
no longer uses the removed `util.isError`). Avoid requiring modules
that were only transitive dependencies of Seneca 3, such as `optioner`
or `@hapi/joi`: Seneca 4 does not install them.
