import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  flowGovernanceCliCommandEntries,
  resolveFlowGovernanceCliArgv,
} from '../flow-governance-review/scripts/lib/cli-command-manifest.mjs';

test('flow governance wrapper command manifest is the single frozen routing source', () => {
  assert.ok(flowGovernanceCliCommandEntries.length > 10);
  assert.equal(Object.isFrozen(flowGovernanceCliCommandEntries), true);

  const wrapperCommands = flowGovernanceCliCommandEntries.map((entry) => entry.wrapperCommand);
  assert.equal(new Set(wrapperCommands).size, wrapperCommands.length);

  for (const entry of flowGovernanceCliCommandEntries) {
    assert.equal(Object.isFrozen(entry), true);
    assert.equal(Object.isFrozen(entry.cliArgv), true);
    assert.ok(entry.cliArgv.length >= 2);
    assert.deepEqual(resolveFlowGovernanceCliArgv(entry.wrapperCommand), [...entry.cliArgv]);
  }
  assert.equal(resolveFlowGovernanceCliArgv('unknown-command'), null);

  const wrapperSource = readFileSync(
    new URL('../flow-governance-review/scripts/run-flow-governance-review.mjs', import.meta.url),
    'utf8',
  );
  assert.match(wrapperSource, /resolveFlowGovernanceCliArgv/u);
  assert.doesNotMatch(wrapperSource, /const cliBackedCommands = new Map/u);
});
