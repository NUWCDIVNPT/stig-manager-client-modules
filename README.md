# stig-manager-client-modules
JavaScript modules for STIG Manager clients. This README and other documentation is under construction.

## Using the modules in Node.js
In the root of a project, open a terminal and execute:

```
$ npm install git+https://github.com/nuwcdivnpt/stig-manager-client-modules#semver:^1.4.0
```

Importing all modules into ESM code

```
import * as StigmanLib from `stig-manager-client-modules`

const result = StigmanLib.reviewsFromCkl( ... )
const result = StigmanLib.reviewsFromCklb( ... )
const result = StigmanLib.reviewsFromXccdf( ... )

const tasks = new StigmanLib.TaskObject ( ... )

```

Importing an individual module into ESM code

```
import { reviewsFromCkl } from `stig-manager-client-modules`
const result = reviewsFromCkl( ... )
```

Requiring all modules into CJS code

```
const StigmanLib = require('stig-manager-client-modules')

const result = StigmanLib.reviewsFromCkl( ... )
const result = StigmanLib.reviewsFromCklb( ... )
const result = StigmanLib.reviewsFromXccdf( ... )

const tasks = new StigmanLib.TaskObject ( ... )
```

Requiring an individual module into CJS code
```
const { reviewsFromCkl } = require('stig-manager-client-modules')

const result = reviewsFromCkl( ... )
```

## 






