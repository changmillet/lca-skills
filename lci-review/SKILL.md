---
name: lci-review
description: Unified LCI review skill with profile routing. Default profile is process; flow/model are reserved for future expansion.
---

# lci-review

统一入口的 LCI 复审 skill，采用 **main skill + profile** 架构。

## Profiles
- `process`（默认）：当前可用，执行 process_from_flow 产物复审。
- `flow`：预留（not implemented yet）。
- `model`：预留（not implemented yet）。

## 统一入口
使用 `scripts/run_review.py`，通过 `--profile` 选择子能力。

### 默认 profile
若未显式传入 `--profile`，默认使用 `process`。

## process profile
输入/输出与历史 `run_lci_review.py` 保持一致：
- 输入：`--run-root --run-id --out-dir [--start-ts] [--end-ts]`
- 输出：
  - `one_flow_rerun_timing.md`
  - `one_flow_rerun_review_v2_zh.md`
  - `one_flow_rerun_review_v2_en.md`
  - `flow_unit_issue_log.md`

## 运行示例
```bash
python scripts/run_review.py \
  --profile process \
  --run-root /path/to/artifacts/process_from_flow/<run_id> \
  --run-id <run_id> \
  --out-dir /home/huimin/.openclaw/workspace/review \
  --start-ts 2026-02-22T16:01:51+00:00 \
  --end-ts 2026-02-22T16:21:40+00:00
```

## 兼容入口（旧路径）
为兼容现有调用，保留：
- `scripts/run_lci_review.py`（转发到 process profile 实现）

## 后续扩展
- `profiles/flow`：沉淀 flow 维度复审规则与脚本。
- `profiles/model`：沉淀 model 维度复审规则与脚本。
当前调用这两个 profile 会返回 “not implemented yet” 并提示下一步。
