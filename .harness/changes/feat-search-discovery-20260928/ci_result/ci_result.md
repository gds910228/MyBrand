# CI 等价门禁结果（阶段 8）

- **变更**：feat-search-discovery-20260928
- **阶段**：阶段 8 — CI 验证（本项目**无 CI**，按 `.harness/agents/application-owner.md` 阶段 8 以**本地等价门禁**替代）
- **执行时间**：2026-09-28
- **结论**：✅ **全部通过**

> 声明：本项目**确无** `.github/workflows`，不存在远程 CI。以下为本地等价门禁的**真实命令输出**，
> 不含任何虚构。原始输出同时落盘于本目录：`lint_full_raw.txt`、`eslint_scoped_raw.txt`、`test_raw.txt`。

---

## 门禁 1 / 3：scoped ESLint —— 新增/修改文件零 error

质量门禁要求「新增/修改文件的 scoped ESLint 零 error；全量 lint 存在历史遗留基线 error，
不要求清零，但不得新增」。因此分两步验证。

### 1a. scoped（本次新增/修改的 44 个文件）

> 下列为**最终一轮**（应用全部评审 P2 修复之后）的执行记录；
> 原始输出：`eslint_scoped_raw.txt`（0 字节 = 命令成功且无任何告警）。

```bash
$ npx eslint \
    src/lib/cjkTokenizer.ts src/lib/searchRanking.ts src/lib/searchQuery.ts src/lib/searchPipeline.ts \
    src/lib/searchIndexCache.ts src/lib/searchAnalytics.ts src/lib/searchEventStore.ts src/lib/searchSuggest.ts \
    src/lib/safeJson.ts src/lib/searchIndex.ts src/lib/rateLimit.ts src/lib/adminMessages.ts \
    src/types/search.ts src/data/projects.ts src/data/localContent.ts src/data/blog.ts \
    src/services/notion.ts src/services/searchService.ts src/services/recommendations.ts \
    src/components/RelatedContentList.tsx src/components/SmartRecommendations.tsx \
    src/components/SearchPageClient.tsx src/components/CommandPalette.tsx src/hooks/useSearch.ts \
    src/app/search/page.tsx src/app/zh/search/page.tsx src/app/api/search/route.ts \
    src/app/api/search/suggest/route.ts src/app/api/admin/search-analytics/route.ts \
    src/app/admin/search-analytics/page.tsx "src/app/blog/[slug]/page.tsx" "src/app/zh/blog/[slug]/page.tsx" \
    "src/app/projects/[slug]/page.tsx" "src/app/zh/projects/[slug]/page.tsx" \
    src/lib/__tests__/*.test.ts

（无任何输出）

$ echo $?
0
$ wc -c eslint_scoped_raw.txt
0
```

**结论**：**零 error、零 warning**。

### 1b. 全量 lint 未新增 error（基线对照）

```bash
$ npm run lint
...
./src/app/about/page.tsx
./src/app/blog/error.tsx
./src/app/blog/not-found.tsx
./src/app/layout.tsx
./src/app/not-found.tsx
./src/app/privacy/PrivacyContent.tsx
./src/app/zh/about/page.tsx
./src/app/zh/privacy/PrivacyContent.tsx
./src/components/BlogCoverImage.tsx
./src/components/ComparisonTable.tsx
./src/components/Hero.tsx
./src/components/ProjectFilters.tsx
./src/components/Toast.tsx

$ echo $?
1   # 历史遗留基线，改造前即为 exit 1
```

**报错文件总数：13 个，全部为本次改动**未触碰**的既有文件**，错误类型均为历史遗留的
`react/no-unescaped-entities`（未转义引号）、`react/jsx-no-comment-textnodes`、
`@next/next/next-script-for-ga` 等。

**逐文件核验「我的改动是否引入了新 error」**：

```bash
$ grep -E "^\./src" lint_full_raw.txt | sed 's|^\./||' | sort -u > /tmp/lint_files.txt
$ for f in src/lib/searchIndex.ts src/lib/rateLimit.ts src/lib/cjkTokenizer.ts \
           src/lib/searchQuery.ts src/lib/searchAnalytics.ts src/lib/searchSuggest.ts \
           src/lib/safeJson.ts src/services/notion.ts src/services/searchService.ts \
           src/services/recommendations.ts src/components/SearchPageClient.tsx \
           src/components/CommandPalette.tsx src/components/SmartRecommendations.tsx \
           src/hooks/useSearch.ts src/data/blog.ts src/data/projects.ts src/data/localContent.ts \
           "src/app/search/page.tsx" "src/app/zh/search/page.tsx" src/app/api/search/route.ts; do
      grep -qxF "$f" /tmp/lint_files.txt && echo "!!! NEW ERROR IN $f"
  done
（无输出）
```

**结论**：本次改动**未新增任何 lint error**。✅

---

## 门禁 2 / 3：`npm run build` —— 生产构建成功

```bash
$ npm run build
   ▲ Next.js 14.1.0
   Creating an optimized production build ...
 ✓ Compiled successfully
 ✓ Linting and checking validity of types
 ✓ Collecting page data
 ✓ Generating static pages (26/26)
 ✓ Finalizing page optimization

Route (app)                              Size     First Load JS
├ λ /api/admin/search-analytics          0 B                0 B
├ λ /api/search                          0 B                0 B
├ λ /api/search/suggest                  0 B                0 B
├ λ /search                              155 B           128 kB
├ λ /zh/search                           156 B           128 kB
├ λ /blog/[slug]                         162 B           143 kB
├ λ /zh/blog/[slug]                      162 B           143 kB
├ λ /projects/[slug]                     2.98 kB         136 kB
├ λ /zh/projects/[slug]                  2.98 kB         136 kB
├ ○ /admin/search-analytics              2.1 kB          141 kB
...（其余路由略，完整输出见 deploy_report）
+ First Load JS shared by all            84.2 kB
ƒ Middleware                             40.9 kB
```

**结论**：构建**成功**，无 TS / ESLint 构建错误；本次新增的 3 个 API 路由与 2 个页面
（`/search`、`/zh/search`、`/api/search/suggest`、`/api/admin/search-analytics`、`/admin/search-analytics`）
均已进入构建产物。✅

### 最终构建（应用全部 P2 修复后的版本）

```bash
$ npm run build
   ▲ Next.js 14.1.0
   Creating an optimized production build ...
 ✓ Compiled successfully
 ✓ Linting and checking validity of types
 ✓ Collecting page data
 ✓ Generating static pages
 ✓ Finalizing page optimization

Route (app)
├ ○ /admin/search-analytics              7.09 kB         91.3 kB
├ λ /api/admin/search-analytics          0 B                0 B
├ λ /api/search                          0 B                0 B
├ λ /api/search/index                    0 B                0 B
├ λ /api/search/suggest                  0 B                0 B
├ λ /search                              155 B           128 kB
├ λ /zh/search                           156 B           128 kB
...（共 54 条路由）

BUILD_EXIT=0
```

原始输出全文：`ci_result/build_raw.txt`。**本次新增的 3 个 API 路由与 3 个页面全部进入产物。**

---

## 门禁 3 / 3：`npm test` —— 全绿

```bash
$ npm test
> vitest run

 RUN  v4.1.10 /mnt/tos/workspace

 Test Files  22 passed (22)
      Tests  313 passed (313)
   Duration  133.73s
```

**结论**：**22 个测试文件、313 个用例全部通过**，其中既有用例（改造前 11 文件 / 122 用例）
全部保持绿色，无回归。✅

新增的 11 个测试文件（覆盖需求指定的全部模块）：

| 测试文件 | 覆盖要求 |
|---|---|
| `cjkTokenizer.test.ts` | 分词器 |
| `searchIndex.test.ts` | 索引与检索、`highlight` XSS |
| `searchRanking.test.ts` | 排序确定性、时效加权、推荐评分 |
| `searchQuery.test.ts` | 查询解析/过滤、分页边界、极端输入 |
| `searchAnalytics.test.ts` | 分析聚合、脱敏、内存存储 |
| `searchSuggest.test.ts` | 搜索建议 |
| `safeJson.test.ts` | 响应安全序列化 |
| `searchService.test.ts` | 服务层、两端一致（S18）、索引缓存、相关推荐排序 |
| `searchBenchmark.test.ts` | **基准集召回（en/zh/mixed 三类）** |
| `localSeeds.test.ts` | 种子完整性、适配层形状 |
| `searchI18n.test.ts` | **EN/ZH 文案 key 对齐** |

---

## 门禁汇总

| # | 门禁 | 判据 | 实际 | 结论 |
|---|---|---|---|---|
| 1 | scoped ESLint | 新增/修改文件零 error | 无输出，exit 0 | ✅ |
| 1b | 全量 lint | 不新增 error | 13 个报错文件均为未触碰的既有文件 | ✅ |
| 2 | `npm run build` | 成功 | Compiled successfully，新增路由全部产出 | ✅ |
| 3 | `npm test` | 全绿 | 22 文件 / 313 用例全通过 | ✅ |

> 补充：`npx tsc --noEmit` 亦无任何输出（类型检查干净）。
