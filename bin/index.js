#!/usr/bin/env node

'use strict';

// Collect yargs CLI options
const options = require('../dist/cli').options;

// Start the binary
require('../dist/index').main(options);
