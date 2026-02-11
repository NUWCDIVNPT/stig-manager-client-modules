# Vendored Dependencies

This project vendors two npm packages as bundled ESM files rather than importing them directly from `node_modules`. This is necessary because these modules are used in browser environments where bare specifiers (e.g., `import X from 'some-package'`) are not supported without a bundler or import maps.

## Vendored packages

| Package | Vendored file | Export style | Why bundling is needed |
|---|---|---|---|
| [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) | `fxp.esm.js` | `export { XMLParser }` (named) | Multiple internal source files need combining into one |
| [papaparse](https://github.com/mholt/PapaParse) | `papaparse-esm.js` | `export default function()` (factory) | CJS-only package needs conversion to ESM |

Both packages are listed in `devDependencies` with pinned versions matching the vendored files. This enables Dependabot to detect and alert on new versions. The rollup plugins needed for bundling (`@rollup/plugin-node-resolve` and `@rollup/plugin-commonjs`) are also in `devDependencies`.

## Updating fast-xml-parser

fast-xml-parser is native ESM but has multiple internal files and a `strnum` dependency. Rollup with `@rollup/plugin-node-resolve` bundles everything into a single file.

1. Update the version in `package.json` under `devDependencies`.

2. Install the updated package:
   ```
   npm install
   ```

3. Create a temporary entry file, bundle, and clean up:
   ```
   echo "export { XMLParser } from 'fast-xml-parser'" > _fxp_entry.js
   npx rollup _fxp_entry.js --file fxp.esm.js --format esm --plugin @rollup/plugin-node-resolve
   rm _fxp_entry.js
   ```

4. Run the test suite:
   ```
   npm test
   ```

## Updating papaparse

papaparse is a CJS/UMD library. The vendored file wraps the import as a factory function so consumers call `Papa()` to get the API object. This requires both `@rollup/plugin-node-resolve` and `@rollup/plugin-commonjs`, and uses the browser entry point to avoid a Node.js `stream` dependency.

1. Update the version in `package.json` under `devDependencies`.

2. Install the updated package:
   ```
   npm install
   ```

3. Create a temporary entry file that wraps papaparse as a factory function:
   ```
   cat > _papa_entry.js << 'EOF'
   import Papa from 'papaparse'
   export default function() { return Papa }
   EOF
   ```

4. Bundle using the browser entry point:
   ```
   npx rollup _papa_entry.js --file papaparse-esm.js --format esm \
     --plugin @rollup/plugin-node-resolve="{browser: true}" \
     --plugin @rollup/plugin-commonjs
   ```
   > **Note:** If the inline plugin options cause issues, create a temporary `_rollup.config.mjs` instead. See the rollup-deps branch for a config-based approach.

5. Clean up and run tests:
   ```
   rm _papa_entry.js
   npm test
   ```

## Why a factory function for papaparse?

`AssetCsvParser.js` calls `Papa()` to get the PapaParse API object. The original hand-crafted `papaparse-esm.js` exported the UMD factory function directly. The rollup-based approach preserves this pattern by wrapping: `export default function() { return Papa }`.

## Automated alternative

The `rollup-deps` branch has a fully automated setup with a `rollup.vendor.config.mjs` and an `npm run vendor` script that handles both packages. If the manual process described above becomes cumbersome, consider merging that branch.
