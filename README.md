<a href="https://npmjs.org/package/%40nuwcdivnpt%2Fstig-manager-client-modules"><img src="https://img.shields.io/npm/v/%40nuwcdivnpt%2Fstig-manager-client-modules"></a>

# stig-manager-client-modules
JavaScript modules for STIG Manager clients. This README and other documentation is under construction.

These modules are used by the [STIGMan Watcher](https://github.com/nuwcdivnpt/stigman-watcher) and the [STIG Manager GUI](https://github.com/nuwcdivnpt/stig-manager) clients to parse STIG checklist data (ReviewParser.js) and to define the tasks (TaskObject.js) that will be required to import that checklist data into a STIG Manager API instance. 

The ReviewParser supports multiple STIG checklist formats:
- **CKL** (Checklist format) - Standard STIG Manager checklist files
- **CKLB** (Checklist Binary) - Binary/JSON format checklists  
- **XCCDF** (eXtensible Configuration Checklist Description Format) - SCAP compliance results
- **ARF** (Asset Reporting Format) - OpenSCAP/Red Hat Satellite compliance scan results 

The modules are offered here to help keep the STIG Manager clients in sync, and as a resource to developers that may want to build their own STIG Manager clients or have a need to parse checklist data, etc.
Please check those client repos and the STIG Manager API documentation for examples of how to use these modules. 

## Approach

Wherever possible, the objects used in these modules directly match objects defined in the STIG Manager API. 

For example, the `ApiAsset` object defined in these modules is identical to the STIG-Manager API response from a GET request to the `/assets/{assetId}` endpoint with the stigs projection query parameter.
Check the index.d.ts file for the full list of objects and their properties, the inline comments in the modules themselves, and the [STIG Manager Api Definition](https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/specification/stig-manager.yaml).


## Using the modules in Node.js
In the root of a project, open a terminal and execute:

```
$ npm install @nuwcdivnpt/stig-manager-client-modules
```

Importing all modules into ESM code

```
import * as StigmanLib from `stig-manager-client-modules`

const result = StigmanLib.reviewsFromCkl( ... )
const result = StigmanLib.reviewsFromCklb( ... )
const result = StigmanLib.reviewsFromXccdf( ... )
const result = StigmanLib.reviewsFromArf( ... )

const tasks = new StigmanLib.TaskObject ( ... )

```

Importing an individual module into ESM code

```
import { reviewsFromCkl, reviewsFromArf } from `stig-manager-client-modules`
const result = reviewsFromCkl( ... )
const arfResult = reviewsFromArf( ... )
```

Requiring all modules into CJS code

```
const StigmanLib = require('stig-manager-client-modules')

const result = StigmanLib.reviewsFromCkl( ... )
const result = StigmanLib.reviewsFromCklb( ... )
const result = StigmanLib.reviewsFromXccdf( ... )
const result = StigmanLib.reviewsFromArf( ... )

const tasks = new StigmanLib.TaskObject ( ... )
```

Requiring an individual module into CJS code
```
const { reviewsFromCkl, reviewsFromArf } = require('stig-manager-client-modules')

const result = reviewsFromCkl( ... )
const arfResult = reviewsFromArf( ... )
```
