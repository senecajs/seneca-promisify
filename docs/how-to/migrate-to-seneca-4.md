# Migrate to the Seneca 4 built-in promise API

How to move code that uses seneca-promisify on Seneca 3 to Seneca 4,
where `message`, `post`, `prepare`, `destroy` and promise returning
`ready`, `close` and `prior` are part of the core. The general Seneca
migration steps are in the
[Seneca 4 migration guide](https://github.com/senecajs/seneca/blob/master/docs/how-to/migrate-from-seneca-3.md).

## 1. Upgrade Seneca

Seneca 4 needs Node.js 22 or later:

```sh
npm install seneca@^4.0.0-rc5
```

## 2. Remove the plugin

Delete `seneca.use('promisify')` and the `seneca-promisify` dependency.
Nothing else changes for `message`, `post`, `prepare`, `destroy`,
`await this.prior(msg)`, `await seneca.ready()` and `await seneca.close()`:
the core implementations behave as the plugin did.

If the code must keep running on Seneca 3 as well, keep the plugin: on
Seneca 4 it is a no-op. See
[Support Seneca 3 and Seneca 4 in one plugin](support-seneca-3-and-4.md).

## 3. Replace send with act

Seneca 4 has no `send`. Fire-and-forget messages use `act` without a
callback:

```js
// Seneca 3 with seneca-promisify
seneca.send('role:shop,cmd:log,item:apple')

// Seneca 4
seneca.act('role:shop,cmd:log,item:apple')
```

## 4. Stop reading the marker

`seneca.__promisify$$` is not set on Seneca 4. Code that checked it
before calling `post` or `message` can call them directly.

## 5. Update error handling

Seneca 4 does not wrap action errors: `post` rejects with the error the
action threw. `err.message` is the original message, `err.code` is
whatever the thrown error carries (`undefined` for a plain `Error`),
and `err.orig` does not exist. The Seneca wrapper is available as
`err.meta$.err`.

```js
// Seneca 3 with seneca-promisify
catch (err) { console.log(err.code, err.orig.message) } // act_execute unknown item: kiwi

// Seneca 4
catch (err) { console.log(err.message) }                // unknown item: kiwi
```

Tests that assert on `seneca: Action ... failed:` or on `err.orig` need
`err.message` instead.

## 6. Check close hooks

`destroy` on Seneca 4 registers on `sys:seneca,cmd:close`. Code that
registered a close hook itself with `seneca.message('role:seneca,cmd:close', fn)`
keeps working on Seneca 4.0.0, which calls that pattern during close
for compatibility, but not on 4.0.0-rc5. Prefer `this.destroy(fn)`.

## 7. Drop the active options

The `active` flags were only read by the plugin. Remove them together
with the `use('promisify')` call. If your application turned off a
decoration to keep a name free for its own method, note that on Seneca
4 `post`, `message`, `prepare`, `destroy`, `prior` and `ready` are core
methods; `seneca.decorate` refuses to override them.

## 8. Chaining on ready

With the plugin, `seneca.ready(callback)` returned a promise. On Seneca
4 it returns the instance again, so `seneca.ready(cb).use(...)` works.
`await seneca.ready()` resolves with the instance on both. On
4.0.0-rc5 awaiting `ready()` on an idle instance never resolves (fixed
in 4.0.0); use `seneca.ready(callback)` there.

## 9. Entities

seneca-entity provides its own promise API (`seneca.entity(name)` with
`await ent.save$()`); nothing changes. Use `seneca-entity@^28.1.0` with
Seneca 4.

## 10. Check the result

Run your test suite. A plugin that still requires `seneca-promisify`
loads and does nothing, so a leftover `use('promisify')` is not an
error, only a dependency you can remove.
