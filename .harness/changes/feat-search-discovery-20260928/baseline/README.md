# 基线采集脚本

## 端到端基线（改造前代码 + 空 Key）
`run_benchmark.sh` — 对基准集 12 条查询逐条调用 `/api/search` 并记录命中。

```bash
npx next dev -p 3100
bash run_benchmark.sh http://localhost:3100 /tmp/baseline_e2e.txt
```

## 检索层隔离基线（决策 D-05）
`run_retrieval_baseline.test.ts` — 固定语料、只替换检索实现为改造前版本
（`original/searchIndex.original.ts`），隔离出「分词/检索质量」这一因。

该文件**刻意不放在 `src/`**：vitest 的 `include` 是 `src/**/*.test.ts`，
放在这里可避免它进入 `npm test` 门禁（它依赖 `.harness/` 路径且只做记录、不做断言）。

复现方式：
```bash
cp run_retrieval_baseline.test.ts /mnt/tos/workspace/src/lib/__tests__/
npx vitest run src/lib/__tests__/run_retrieval_baseline.test.ts --reporter=verbose
rm /mnt/tos/workspace/src/lib/__tests__/run_retrieval_baseline.test.ts
```

产物：`baseline_retrieval_isolated.txt`（改造前实现 7/12）。
