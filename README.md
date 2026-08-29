---
docType: guide
scope: repo
status: active
authoritative: false
owner: skills
language: en
whenToUse:
  - when installing TianGong LCA skills
  - when checking wrapper execution expectations
whenToUpdate:
  - when skill installation guidance changes
  - when the unified CLI wrapper contract changes
checkPaths:
  - README.md
  - README.zh-CN.md
  - scripts/lib/cli-launcher.mjs
  - scripts/validate-skills.mjs
  - "*/SKILL.md"
  - "*/scripts/**"
lastReviewedAt: 2026-08-29
lastReviewedCommit: b5be396684455c04344abbdf7b8574c531dbd19d
lastReviewedNote: "Reviewed for Skills #83: validation uses exact pnpm 11.24 and CLI 0.1.3 while external Skills CLI installation remains unchanged."
---

# Tiangong LCA Skills

Repository: https://github.com/tiangong-lca/skills

Use the `skills` CLI from https://github.com/vercel-labs/skills to install, update, and manage these skills.

## Install the CLI

```bash
npm i skills@latest -g
```

## Install

- List available skills (no install):
  ```bash
  npx skills add https://github.com/tiangong-lca/skills --list
  ```
- Install all skills (project scope by default):
  ```bash
  npx skills add https://github.com/tiangong-lca/skills
  ```
- Install specific skills:
  ```bash
  npx skills add https://github.com/tiangong-lca/skills --skill flow-hybrid-search --skill process-hybrid-search
  ```

## Target agents and scope

- Target specific agents:
  ```bash
  npx skills add https://github.com/tiangong-lca/skills -a codex -a claude-code
  ```
- Install globally (user scope):
  ```bash
  npx skills add https://github.com/tiangong-lca/skills -g
  ```
- Scope notes:
  - Project scope installs into `./<agent>/skills/`.
  - Global scope installs into the per-agent user skills directory resolved by the `skills` CLI on the current platform. Use `npx skills list` to inspect the exact path on macOS, Linux, or Windows.

## Install method

- Interactive installs let you choose:
  - Symlink (recommended)
  - Copy

## Update and verify

- List installed skills:
  ```bash
  npx skills list
  ```
- Check for updates:
  ```bash
  npx skills check
  ```
- Update all skills:
  ```bash
  npx skills update
  ```

## External runtime skills

This repository owns checked-in TianGong LCA workflow skills. Fast-moving Tiangong KB research skills are consumed from their owning repositories at runtime instead of being mirrored here.

For source-evidence dataset development that needs SCI paper evidence, resolve the latest external skill from `tiangong-ai/skills`:

```bash
npx skills use https://github.com/tiangong-ai/skills --skill tiangong-kb-sci-search --full-depth
```

Optional local project install:

```bash
npx skills add https://github.com/tiangong-ai/skills --skill tiangong-kb-sci-search --agent '*' --yes --full-depth
npx skills update --project --yes
```

Consuming projects should record the resolved upstream ref and command in task artifacts. Do not copy `tiangong-kb-*` skill folders into this repository unless the ownership boundary changes deliberately.

## Foundry top-level workflows

- `$external-dataset-curated-import`: BAFU, USLCI, and other structured LCA package imports through CLI conversion, curation queue `next`/`verify`, child skills, and publish handoff gates.
- `$source-evidence-dataset-development`: evidence-driven data creation or update from PDFs, Word files, URLs, APIs, reports, database references, or scientific literature.
- `$dataset-rls-maintenance`: current-user RLS-scoped cleanup, delete/retire, reference repair, and redo planning for previously imported rows; orchestrates CLI maintenance plans and readback verification without private database access.

## Validation

- Repository validation requires Node `24.19.0` and pnpm `11.24.0`; install the pinned validation package from `pnpm-lock.yaml` first:
  ```bash
  pnpm install --frozen-lockfile
  ```
- Validate the canonical CLI-backed wrappers and migration doc guards locally:
  ```bash
  pnpm validate
  ```
- Validate against an unpublished local CLI working tree:
  ```bash
  TIANGONG_LCA_CLI_DIR=/path/to/tiangong-lca-cli \
  pnpm validate
  ```
- Validate only the skills you changed:
  ```bash
  pnpm validate lifecycleinventory-qa process-hybrid-search
  ```
- CI runs the same validation in `.github/workflows/validate-skills.yml` after checking out immutable CLI `0.1.3` merge/tag commit `bcdb7c5522a7fda92e16115ac08ef1a2d3def67d`, installing both repositories with frozen pnpm lockfiles, and building the CLI.

## Execution note

Skills in this repository are expected to be thin wrappers over the unified `tiangong-lca` CLI.

Current rules:

- wrappers default to the exact published CLI through `pnpm dlx --package=@tiangong-lca/cli@0.1.3 tiangong-lca`; sibling directories are never auto-discovered
- local execution is opt-in only through `--cli-dir` or `TIANGONG_LCA_CLI_DIR`
- use `--published-cli` to override a local CLI environment for an explicit published-package case; nested wrappers propagate that selection
- local CLI overrides must identify `@tiangong-lca/cli@0.1.3` with its exact Node/pnpm engines and a v9 `pnpm-lock.yaml`; stale local builds are installed with `pnpm install --frozen-lockfile` before `pnpm run build`
- the local pre-push hook validates CLI package and lock evidence before it installs or builds an explicitly selected local checkout
- launcher execution uses argv arrays with `shell: false`, so paths containing spaces remain one argument and child exit/stdout/stderr are preserved
- for remote process QA snapshots, prefer `tiangong-lca process list --json` followed by `qa process --rows-file ...` instead of ad hoc bridge scripts
- use native cross-platform Node `.mjs` wrappers as the canonical entrypoint
- skill wrappers should not bundle business-specific Python runtimes, shell shims, MCP transports, or private env parsers
- if a capability is missing, add a native `tiangong-lca <noun> <verb>` command first, then update the skill to call it
