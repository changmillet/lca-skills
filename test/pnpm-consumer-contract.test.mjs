import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function collectMarkdown(rootDir) {
  const files = [];
  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue;
    }
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMarkdown(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

test('repository package contract pins the workspace Node and pnpm versions', () => {
  const manifest = JSON.parse(read('package.json'));
  assert.equal(manifest.packageManager, 'pnpm@11.23.0');
  assert.deepEqual(manifest.engines, {
    node: '24.19.0',
    pnpm: '11.23.0',
  });
  assert.match(read('pnpm-lock.yaml'), /^lockfileVersion: '9\.0'$/mu);
});

test('validation CI installs the exact CLI checkout through frozen pnpm only', () => {
  const workflow = read('.github/workflows/validate-skills.yml');

  assert.match(workflow, /ref: cli-v0\.1\.1/u);
  assert.match(workflow, /node-version: '24\.19\.0'/u);
  assert.match(workflow, /uses: pnpm\/action-setup@v4/u);
  assert.match(workflow, /version: 11\.23\.0/u);
  assert.match(workflow, /cache: pnpm/u);
  assert.match(workflow, /pnpm install --frozen-lockfile/u);
  assert.match(workflow, /pnpm run build/u);
  assert.doesNotMatch(workflow, /package-lock\.json|\bnpm (?:ci|exec|run)\b/u);
});

test('local push gate prepares Skills and CLI through frozen pnpm only', () => {
  const hook = read('.githooks/pre-push');

  assert.match(hook, /pnpm install --frozen-lockfile/u);
  assert.match(hook, /pnpm run build/u);
  assert.match(hook, /pnpm prepush:gate/u);
  assert.doesNotMatch(hook, /package-lock\.json|\bnpm (?:ci|exec|run)\b/u);
});

test('checked-in docs pin the TianGong CLI while preserving external skills npx governance', () => {
  for (const filePath of collectMarkdown(repoRoot)) {
    const text = readFileSync(filePath, 'utf8');
    assert.doesNotMatch(
      text,
      /@tiangong-lca\/cli@latest|npm exec[^\n]*@tiangong-lca\/cli/u,
      path.relative(repoRoot, filePath),
    );
  }

  assert.match(read('README.md'), /npx skills add https:\/\/github\.com\/tiangong-lca\/skills/u);
  assert.match(read('README.zh-CN.md'), /npx skills add https:\/\/github\.com\/tiangong-lca\/skills/u);
  assert.match(read('AGENTS.md'), /consumed through `npx skills`/u);
});
