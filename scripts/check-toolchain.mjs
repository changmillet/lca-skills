#!/usr/bin/env node
import {
  assertSupportedToolchain,
  expectedNodeVersion,
  expectedPnpmVersion,
} from './lib/cli-launcher.mjs';

assertSupportedToolchain();
console.log(`Validated Node ${expectedNodeVersion} and pnpm ${expectedPnpmVersion}.`);
