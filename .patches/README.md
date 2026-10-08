# Workflow patches

GitHub requires the `workflow` OAuth scope to add or change files under
`.github/workflows/`. The session that prepared this branch did not
have it, so the workflow file is provided here as a git patch instead.

Apply it from a checkout with normal credentials:

```sh
git am .patches/*.patch
git rm -r .patches
git commit -m "ci: remove applied workflow patches"
git push
```

| Patch | Adds |
| ----- | ---- |
| `0001-ci-add-the-build-workflow.patch` | `.github/workflows/build.yml`: continuous integration on Node.js 24 (default) and 22 on Ubuntu for pushes and pull requests on `master`. `npm test` runs the suite against the seneca 4 prerelease and against Seneca 3.38. The README build badge points at this workflow. |

The patch is a plain addition; `git apply --check .patches/*.patch`
verifies that it applies.
