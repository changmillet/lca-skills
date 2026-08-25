import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTiangongInvocation,
  expectedNodeVersion,
  expectedPnpmVersion,
  normalizeCliRuntimeArgs,
  publishedCliCommand,
  publishedCliPackageSpec,
  runTiangongCommand,
} from '../scripts/lib/cli-launcher.mjs';

const supportedCliPackage = {
  name: '@tiangong-lca/cli',
  version: '0.1.1',
  packageManager: 'pnpm@11.23.0',
  engines: {
    node: '>=24.19.0 <25',
    pnpm: '11.23.0',
  },
};

const supportedLockfile = "lockfileVersion: '9.0'\nimporters:\n  .:\n";

function localCliFixture(cliDir, overrides = {}) {
  const packageJson = {
    ...supportedCliPackage,
    ...overrides.packageJson,
  };
  const paths = new Set([
    cliDir,
    `${cliDir}/bin`,
    `${cliDir}/bin/tiangong-lca.js`,
    `${cliDir}/package.json`,
    `${cliDir}/pnpm-lock.yaml`,
  ]);

  return {
    pathExists: (candidate) => paths.has(candidate),
    readText: (candidate) => {
      if (candidate === `${cliDir}/package.json`) {
        return JSON.stringify(packageJson);
      }
      if (candidate === `${cliDir}/pnpm-lock.yaml`) {
        return overrides.lockfile ?? supportedLockfile;
      }
      throw new Error(`Unexpected read: ${candidate}`);
    },
    paths,
  };
}

function passingToolchain() {
  return {
    nodeVersion: expectedNodeVersion,
    toolchainSpawnImpl: (command, args, options) => {
      assert.equal(command, process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm');
      assert.deepEqual(args, ['--version']);
      assert.equal(options.shell, false);
      return { status: 0, stdout: `${expectedPnpmVersion}\n`, stderr: '' };
    },
  };
}

test('normalizeCliRuntimeArgs auto-discovers the alternate tiangong-cli sibling', () => {
  const { cliDir, args } = normalizeCliRuntimeArgs(['embedding-ft', '--help'], {
    repoRoot: '/workspace/tiangong-lca-skills',
    pathExists: (candidate) => candidate === '/workspace/tiangong-cli',
  });

  assert.equal(cliDir, '/workspace/tiangong-cli');
  assert.deepEqual(args, ['embedding-ft', '--help']);
});

test('normalizeCliRuntimeArgs keeps explicit cli-dir overrides above auto-discovery', () => {
  const { cliDir, args } = normalizeCliRuntimeArgs(
    ['--cli-dir', '/tmp/manual cli', 'embedding-ft', '--help'],
    {
      repoRoot: '/workspace/tiangong-lca-skills',
      pathExists: () => true,
    },
  );

  assert.equal(cliDir, '/tmp/manual cli');
  assert.deepEqual(args, ['embedding-ft', '--help']);
});

test('buildTiangongInvocation uses exact pnpm dlx argv for the published CLI contract', () => {
  const invocation = buildTiangongInvocation(['qa', 'process', '--help'], {
    repoRoot: '/workspace/tiangong-lca-skills',
    pathExists: () => false,
  });

  assert.equal(publishedCliPackageSpec, '@tiangong-lca/cli@0.1.1');
  assert.equal(invocation.mode, 'published');
  assert.equal(invocation.command, process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm');
  assert.deepEqual(invocation.args, [
    'dlx',
    '--package=@tiangong-lca/cli@0.1.1',
    'tiangong-lca',
    'qa',
    'process',
    '--help',
  ]);
  assert.equal(
    publishedCliCommand,
    'pnpm dlx --package=@tiangong-lca/cli@0.1.1 tiangong-lca',
  );
});

test('buildTiangongInvocation preserves spaces as one authoritative argv value', () => {
  const invocation = buildTiangongInvocation(
    ['dataset', 'validate', '--input', '/workspace/case with spaces/rows.jsonl'],
    {
      repoRoot: '/workspace/skills with spaces',
      pathExists: () => false,
    },
  );

  assert.equal(invocation.args.at(-1), '/workspace/case with spaces/rows.jsonl');
  assert.equal(invocation.args.filter((arg) => arg === '/workspace/case with spaces/rows.jsonl').length, 1);
});

test('buildTiangongInvocation dispatches pnpm.cmd on Windows without changing argv', () => {
  const invocation = buildTiangongInvocation(['qa', 'process', '--help'], {
    platform: 'win32',
    repoRoot: 'C:\\workspace\\skills',
    pathExists: () => false,
  });

  assert.equal(invocation.command, 'pnpm.cmd');
  assert.deepEqual(invocation.args.slice(0, 3), [
    'dlx',
    '--package=@tiangong-lca/cli@0.1.1',
    'tiangong-lca',
  ]);
});

test('buildTiangongInvocation accepts an exact supported local CLI checkout', () => {
  const cliDir = '/workspace/tiangong cli';
  const fixture = localCliFixture(cliDir);
  const invocation = buildTiangongInvocation(['qa', 'process', '--help'], {
    cliDir,
    ...fixture,
  });

  assert.equal(invocation.mode, 'local');
  assert.equal(invocation.command, process.execPath);
  assert.deepEqual(invocation.args, [
    '/workspace/tiangong cli/bin/tiangong-lca.js',
    'qa',
    'process',
    '--help',
  ]);
  assert.equal(invocation.packageVersion, '0.1.1');
  assert.equal(invocation.packageManifestPath, `${cliDir}/package.json`);
  assert.equal(invocation.lockfilePath, `${cliDir}/pnpm-lock.yaml`);
});

test('buildTiangongInvocation fails closed when local CLI package evidence is missing', () => {
  const cliDir = '/workspace/tiangong-lca-cli';
  const fixture = localCliFixture(cliDir);
  fixture.paths.delete(`${cliDir}/pnpm-lock.yaml`);

  assert.throws(
    () =>
      buildTiangongInvocation(['--help'], {
        cliDir,
        ...fixture,
      }),
    /requires pnpm-lock\.yaml/u,
  );
});

test('buildTiangongInvocation fails closed on mismatched local CLI package state', () => {
  const cliDir = '/workspace/tiangong-lca-cli';
  const fixture = localCliFixture(cliDir, {
    packageJson: {
      version: '0.1.2',
    },
  });

  assert.throws(
    () =>
      buildTiangongInvocation(['--help'], {
        cliDir,
        ...fixture,
      }),
    /expected @tiangong-lca\/cli@0\.1\.1/u,
  );
});

test('runTiangongCommand preserves exact exit, stdout, and stderr and forbids shell execution', () => {
  let stdout = '';
  let stderr = '';
  let observedOptions;
  const exitCode = runTiangongCommand(
    ['dataset', 'validate', '--input', '/workspace/case with spaces/rows.jsonl'],
    {
      repoRoot: '/workspace/skills',
      pathExists: () => false,
      ...passingToolchain(),
      spawnOptions: { shell: true },
      spawnImpl: (_command, _args, options) => {
        observedOptions = options;
        return {
          status: 23,
          stdout: 'exact stdout\n',
          stderr: 'exact stderr\n',
        };
      },
      stdoutWrite: (text) => {
        stdout += text;
      },
      stderrWrite: (text) => {
        stderr += text;
      },
    },
  );

  assert.equal(exitCode, 23);
  assert.equal(stdout, 'exact stdout\n');
  assert.equal(stderr, 'exact stderr\n');
  assert.equal(observedOptions.shell, false);
});

test('runTiangongCommand preserves a successful no-output result', () => {
  let stderr = '';
  const exitCode = runTiangongCommand(['qa', 'process', '--help'], {
    repoRoot: '/workspace/tiangong-lca-skills',
    pathExists: () => false,
    ...passingToolchain(),
    spawnImpl: () => ({ status: 0, stdout: '', stderr: '' }),
    stderrWrite: (text) => {
      stderr += text;
    },
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr, '');
});

test('runTiangongCommand rejects a mismatched pnpm runtime before CLI dispatch', () => {
  let dispatched = false;

  assert.throws(
    () =>
      runTiangongCommand(['--help'], {
        repoRoot: '/workspace/skills',
        pathExists: () => false,
        nodeVersion: expectedNodeVersion,
        toolchainSpawnImpl: () => ({ status: 0, stdout: '11.22.0\n', stderr: '' }),
        spawnImpl: () => {
          dispatched = true;
          return { status: 0, stdout: '', stderr: '' };
        },
      }),
    /pnpm 11\.23\.0 is required/u,
  );
  assert.equal(dispatched, false);
});

test('runTiangongCommand caches one successful toolchain verification per process', () => {
  let verificationCount = 0;
  let dispatchCount = 0;
  const toolchainSpawnImpl = () => {
    verificationCount += 1;
    return { status: 0, stdout: `${expectedPnpmVersion}\n`, stderr: '' };
  };
  const options = {
    repoRoot: '/workspace/skills',
    pathExists: () => false,
    nodeVersion: expectedNodeVersion,
    toolchainSpawnImpl,
    spawnImpl: () => {
      dispatchCount += 1;
      return { status: 0, stdout: '', stderr: '' };
    },
  };

  assert.equal(runTiangongCommand(['--help'], options), 0);
  assert.equal(runTiangongCommand(['--help'], options), 0);
  assert.equal(verificationCount, 1);
  assert.equal(dispatchCount, 2);
});

test('runTiangongCommand installs from the frozen local lockfile before rebuilding a stale CLI', () => {
  const cliDir = '/workspace/tiangong-lca-cli';
  const fixture = localCliFixture(cliDir);
  for (const entry of [
    `${cliDir}/dist/src/main.js`,
    `${cliDir}/src`,
    `${cliDir}/src/cli.ts`,
    `${cliDir}/tsconfig.build.json`,
    `${cliDir}/node_modules/.modules.yaml`,
  ]) {
    fixture.paths.add(entry);
  }
  const directories = new Set([cliDir, `${cliDir}/bin`, `${cliDir}/src`]);
  const mtimes = new Map([
    [`${cliDir}/dist/src/main.js`, 10],
    [`${cliDir}/src`, 20],
    [`${cliDir}/src/cli.ts`, 20],
    [`${cliDir}/bin/tiangong-lca.js`, 5],
    [`${cliDir}/package.json`, 5],
    [`${cliDir}/pnpm-lock.yaml`, 5],
    [`${cliDir}/tsconfig.build.json`, 5],
    [`${cliDir}/node_modules/.modules.yaml`, 5],
  ]);
  const preparationCalls = [];
  const runCalls = [];

  const exitCode = runTiangongCommand(['process', 'save-draft', '--help'], {
    cliDir,
    ...fixture,
    ...passingToolchain(),
    readDir: (candidate) => (candidate === `${cliDir}/src` ? ['cli.ts'] : []),
    statPath: (candidate) => ({
      mtimeMs: mtimes.get(candidate) ?? 1,
      isDirectory: () => directories.has(candidate),
    }),
    buildSpawnImpl: (command, args, options) => {
      preparationCalls.push({ command, args, cwd: options.cwd, shell: options.shell });
      return { status: 0, stdout: '', stderr: '' };
    },
    spawnImpl: (command, args, options) => {
      runCalls.push({ command, args, shell: options.shell });
      return { status: 0, stdout: 'process save-draft help', stderr: '' };
    },
    stdoutWrite: () => {},
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(preparationCalls, [
    {
      command: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      args: ['install', '--frozen-lockfile'],
      cwd: cliDir,
      shell: false,
    },
    {
      command: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      args: ['run', 'build'],
      cwd: cliDir,
      shell: false,
    },
  ]);
  assert.equal(runCalls.length, 1);
  assert.equal(runCalls[0].command, process.execPath);
  assert.deepEqual(runCalls[0].args, [
    `${cliDir}/bin/tiangong-lca.js`,
    'process',
    'save-draft',
    '--help',
  ]);
  assert.equal(runCalls[0].shell, false);
});
