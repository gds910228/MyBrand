#!/usr/bin/env bash
# 基准集召回采集脚本（feat-search-discovery-20260928）
# 用法: bash run_benchmark.sh <baseUrl> <outFile>
# 对 src/lib/__tests__/fixtures/searchBenchmark.json 中 12 条查询逐条调用 /api/search，
# 记录 HTTP 状态、命中 id 序列、召回是否满足 expectAnyOf / expectNoneOf。
set -u

BASE="${1:-http://localhost:3100}"
OUT="${2:-/tmp/benchmark_result.txt}"
# 仓库根 = 本脚本所在目录向上 4 层（.harness/changes/<change>/baseline）
REPO_ROOT="$(cd "$(dirname "$0")/../../../../" && pwd)"
FIXTURE="$REPO_ROOT/src/lib/__tests__/fixtures/searchBenchmark.json"

if [ ! -f "$FIXTURE" ]; then
  echo "fixture not found: $FIXTURE" >&2
  exit 1
fi

: > "$OUT"

node -e '
const fs = require("fs");
const [fixturePath, base, out] = process.argv.slice(1);
const fx = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const lines = [];
let pass = 0;

(async () => {
  for (const c of fx.queries) {
    const url = `${base}/api/search?q=${encodeURIComponent(c.q)}&locale=${c.locale}&pageSize=50`;
    let status = 0, ids = [], body = "";
    try {
      const res = await fetch(url);
      status = res.status;
      body = await res.text();
      const json = JSON.parse(body);
      // 响应项的 `id` 已是全局口径 `<type>:<refId>`（feat-search-discovery 起）。
      // 兼容改造前只返回 refId 的旧口径：若不含冒号则补上 type 前缀。
      ids = (json.results || []).map((r) => (String(r.id).indexOf(String.fromCharCode(58)) >= 0 ? String(r.id) : String(r.type) + String.fromCharCode(58) + String(r.id)));
    } catch (e) {
      body = String(e);
    }

    const hitAny = c.expectAnyOf.length === 0 || c.expectAnyOf.some((id) => ids.includes(id));
    const noForbidden = !c.expectNoneOf.some((id) => ids.includes(id));
    const ok = status === 200 && hitAny && noForbidden;
    if (ok) pass++;

    lines.push(
      `[${ok ? "PASS" : "FAIL"}] ${c.id} (${c.category}) q="${c.q}" locale=${c.locale}\n` +
      `       HTTP=${status}  hits=${ids.length}  ids=[${ids.join(", ")}]\n` +
      `       expectAnyOf=[${c.expectAnyOf.join(", ")}] -> ${hitAny ? "满足" : "未满足"}\n` +
      `       expectNoneOf=[${c.expectNoneOf.join(", ")}] -> ${noForbidden ? "未出现(OK)" : "误召回(FAIL)"}\n`
    );
  }
  lines.push(`\n===== SUMMARY: ${pass}/${fx.queries.length} queries satisfied =====`);
  const byCat = {};
  // 分类统计
  for (const c of fx.queries) byCat[c.category] = (byCat[c.category] || 0) + 1;
  lines.push(`categories: ${JSON.stringify(byCat)}`);
  fs.writeFileSync(out, lines.join("\n"));
  console.log(lines.join("\n"));
})();
' "$FIXTURE" "$BASE" "$OUT"
