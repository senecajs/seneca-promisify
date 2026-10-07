## 3.8.0 2026-10-07

* Seneca 4 prerelease support. The test suite runs against
  `seneca@4.0.0-rc5` (devDependency) and the unreleased 4.0.0, where the
  plugin loads and is a no-op because promises are built into the core,
  and against Seneca 3.38 (devDependency alias `seneca3`), where the
  plugin decorates the instance. The plugin code itself is unchanged:
  `preload` already returned early for versions not starting with `3.`.
* The tests no longer require `optioner`, which Seneca 4 does not
  depend on (it was an unused import that made the suite fail to load).
* The behavioural tests are shared by both runs (`test/behaviour.js`).
  Fire-and-forget messages use `act` on Seneca 4 because `send` is a
  Seneca 3 only decoration. Tests close the instances they open.
* Node.js 24 and 22 are supported and tested; `engines.node` is `>=18`.
* devDependencies: `seneca@^4.0.0-rc5`, `seneca3` (`npm:seneca@^3.38.0`),
  `seneca-entity@^28.1.0`. `coveralls` and `.travis.yml` removed. The
  GitHub Actions `build` workflow (Node.js 24 and 22) is delivered as
  `.patches/0001-ci-add-the-build-workflow.patch`.
* Documentation reorganized under `docs/` following the Diátaxis
  structure: a tutorial with a runnable program, how-to guides (entities,
  active options, supporting Seneca 3 and 4, migrating to Seneca 4), a
  reference for every option and decoration, and explanations of the
  design. The README is a landing page. Example programs in
  `docs/examples/` run on both Seneca versions.
* Package description corrected; repository links point at
  `senecajs/seneca-promisify`.
