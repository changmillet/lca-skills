const entries = [
  ['identity-preflight', ['flow', 'identity-preflight']],
  ['build-plan', ['flow', 'build-plan']],
  ['qa-flows', ['qa', 'flow']],
  ['flow-get', ['flow', 'get']],
  ['flow-list', ['flow', 'list']],
  ['materialize-db-flows', ['flow', 'fetch-rows']],
  ['materialize-approved-decisions', ['flow', 'materialize-decisions']],
  ['remediate-flows', ['flow', 'remediate']],
  ['publish-version', ['flow', 'publish-version']],
  ['publish-reviewed-data', ['flow', 'publish-reviewed-data']],
  ['build-flow-alias-map', ['flow', 'build-alias-map']],
  ['scan-process-flow-refs', ['flow', 'scan-process-flow-refs']],
  ['plan-process-flow-repairs', ['flow', 'plan-process-flow-repairs']],
  ['apply-process-flow-repairs', ['flow', 'apply-process-flow-repairs']],
  ['regen-product', ['flow', 'regen-product']],
  ['validate-processes', ['flow', 'validate-processes']],
];

export const flowGovernanceCliCommandEntries = Object.freeze(
  entries.map(([wrapperCommand, cliArgv]) =>
    Object.freeze({
      wrapperCommand,
      cliArgv: Object.freeze([...cliArgv]),
    }),
  ),
);

const commandIndex = new Map(
  flowGovernanceCliCommandEntries.map(({ wrapperCommand, cliArgv }) => [
    wrapperCommand,
    cliArgv,
  ]),
);

export function resolveFlowGovernanceCliArgv(wrapperCommand) {
  const cliArgv = commandIndex.get(wrapperCommand);
  return cliArgv ? [...cliArgv] : null;
}
