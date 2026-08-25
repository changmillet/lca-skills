---
title: skills Validation Guide
docType: guide
scope: repo
status: active
authoritative: true
owner: skills
language: en
whenToUse:
  - when validating changed skills, wrappers, packaging rules, or documentation governance
  - when selecting proof for a skills repository PR
whenToUpdate:
  - when skill validation commands change
  - when wrapper or packaging proof expectations change
  - when docpact governance rules or CI behavior change
checkPaths:
  - AGENTS.md
  - .docpact/config.yaml
  - .github/workflows/ai-doc-lint.yml
  - scripts/validate-skills.mjs
  - scripts/check-toolchain.mjs
  - scripts/lib/cli-launcher.mjs
  - package.json
  - pnpm-lock.yaml
  - test/**
  - "*/SKILL.md"
  - "*/agents/openai.yaml"
  - .githooks/pre-push
  - scripts/docpact
  - scripts/docpact-gate.sh
  - scripts/install-git-hooks.sh
lastReviewedAt: 2026-08-25
lastReviewedCommit: 06fbd534fc8e31b9709e010fb79b1baaa9e8a055
related:
  - AGENTS.md
  - .docpact/config.yaml
  - docs/agents/repo-architecture.md
---

# skills Validation Guide

Install and validate with the exact repository toolchain:

```bash
pnpm install --frozen-lockfile
pnpm prepush:gate
```

Review note, 2026-06-04: external runtime source-evidence skill guidance remains documentation and instruction-layer work. The new top-level Foundry scenario skills are included in `scripts/validate-skills.mjs`; no new runtime validator path is required because the external Tiangong KB skill is not checked into this repository.
Review note, 2026-08-25: validation now covers the immutable pnpm/Node/CLI consumer contract, exact published and local CLI cases, argv-only dispatch, and live CLI help checks for every flow-governance wrapper manifest route.

The local `pre-push` hook runs docpact first, validates Node `24.19.0` / pnpm `11.23.0`, installs Skills from its frozen lockfile, and defaults to the published CLI. A local `tiangong-lca-cli` is installed/built only when explicitly selected and only after package/engine/lock evidence succeeds. The hook then runs the repository test/validation gate. The GitHub `validate-skills` workflow is manual-dispatch only, so ordinary pushes rely on the local gate.

You may pass one or more skill directories to validate only the touched skill packages.

## Required Validation Shape

- Skill instruction changes require validating the touched skill package.
- Wrapper contract changes require checking the paired `agents/openai.yaml` and `SKILL.md` together.
- Validation-script or test changes require running the full `pnpm prepush:gate` command when feasible.
- New CLI-backed skills must be added to the default validation list when they are intended to ship as part of the standard checked-in skill set.
- Wrapper-launcher changes require `pnpm test:launcher`, the pnpm consumer contract tests, an exact published `@tiangong-lca/cli@0.1.1` help case, and full skill validation against a frozen, built CLI `0.1.1` checkout.
- Documentation-governance changes require docpact validation.

## Docpact Validation

Run these commands for governance changes:

```bash
scripts/docpact validate-config --root . --strict
scripts/docpact lint --root . --base origin/main --head HEAD --mode enforce
```

The manual `ai-doc-lint` workflow delegates to the same local docpact gate when remote reproduction is needed.

## Local Docpact Push Gate

Install the versioned local hook once per checkout:

```bash
./scripts/install-git-hooks.sh
```

The `pre-push` hook runs `scripts/docpact-gate.sh`, which delegates CLI lookup to `scripts/docpact` and performs strict config validation plus enforced lint before the push leaves the machine. It then runs `pnpm check:toolchain`, installs Skills with `pnpm install --frozen-lockfile`, and defaults to the exact published CLI. If `TIANGONG_LCA_CLI_DIR` is explicitly set, `scripts/check-toolchain.mjs --cli-dir` verifies package/name/version/engine/lock evidence before the hook permits frozen install/build. It finishes with `pnpm prepush:gate`. The wrapper checks `DOCPACT_BIN`, Cargo install locations, Homebrew install locations, and then `PATH`, so local agent shells should not fail only because bare `docpact` is unavailable. The default comparison base is `origin/main`. Override it for unusual stacks with `DOCPACT_BASE_REF=<ref>` or `scripts/docpact-gate.sh --base <ref>`. The gate writes its detailed report to a temporary file so normal pushes do not create `.docpact/runs/` artifacts.
