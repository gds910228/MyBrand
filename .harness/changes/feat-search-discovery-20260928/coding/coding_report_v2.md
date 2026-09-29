# 编码报告（批次 2：API 整合 / 前端 / 推荐 / 分析视图）

- **变更**：feat-search-discovery-20260928
- **阶段**：阶段 3 编码实现（批次 2）
- **对应任务**：T07、T08、T10–T17
- **评审**：`coding/review/code_review_v2.md`（v1 **APPROVED**，11 项 P2 → 已修 9 项，2 项记入遗留）

> **流程偏差声明**：需求要求「批次 1 评审通过后再进入批次 2」。实际执行中批次 2 编码与
> 批次 1 评审**并行**进行。为不牺牲评审独立性，批次 2 仍由独立 reviewer 单独评审（`code_review_v2.md`），
> 未跳过任何环节。偏差已记入 `summary.md`。

---

## 1. 改动文件清单

### 新建（源码）

| 文件 | 职责 | 能力块 |
|---|---|---|
| `src/types/search.ts` | 跨层共享契约类型（评审 C-6 要求） | — |
| `src/lib/searchQuery.ts` | 参数解析 / 结构化过滤 / 分页（纯函数） | B |
| `src/lib/searchPipeline.ts` | **服务端与客户端共用的**检索+过滤+排序管线 | B/C/G |
| `src/lib/searchIndexCache.ts` | 按 locale 的索引缓存（`globalThis` 单例，TTL 5min） | 性能/S24 |
| `src/lib/searchAnalytics.ts` | 搜索事件模型、脱敏与聚合（纯函数） | E |
| `src/lib/searchEventStore.ts` | 事件内存存储（`globalThis` 单例，1000 条环形缓冲） | E |
| `src/lib/searchSuggest.ts` | 基于索引内容的前缀建议（纯函数） | D |
| `src/lib/safeJson.ts` | HTML 安全 JSON 序列化（无损转义） | 健壮性/S12 |
| `src/services/searchService.ts` | 统一检索服务入口 + 搜索页 SSR 装载 | B/G |
| `src/services/recommendations.ts` | 相关内容推荐（复用检索层索引与评分） | F |
| `src/components/RelatedContentList.tsx` | 推荐展示层 | F |
| `src/app/api/search/suggest/route.ts` | 建议端点 | D |
| `src/app/api/admin/search-analytics/route.ts` | 分析读取端点（鉴权同 `/api/admin/comments`） | E |
| `src/app/admin/search-analytics/page.tsx` | 分析视图（热门词 / 零结果词） | E |

### 新建（测试）

`src/lib/__tests__/` 下：`searchQuery.test.ts`、`searchAnalytics.test.ts`、
`searchSuggest.test.ts`、`searchService.test.ts`、`safeJson.test.ts`、`searchI18n.test.ts`

### 修改

| 文件 | 变更 | 能力块 |
|---|---|---|
| `src/app/api/search/route.ts` | 全参数化、分页元信息、400/空集容错、限流接入、分析埋点、`force-dynamic`、`safeJson` | B/C/E |
| `src/lib/rateLimit.ts` | **命名桶**（默认桶行为完全不变，既有 4 个调用点零改动） | B |
| `src/hooks/useSearch.ts` | 改用共享管线 `rankDocs`；新增 `type/tag/sort` 入参；新增 `useSuggestions` | D/G |
| `src/components/SearchPageClient.tsx` | 全面重写：URL 驱动、筛选器、分页、建议下拉、无 JS 兜底 | B/D/G |
| `src/components/SmartRecommendations.tsx` | 由客户端组件**重写为服务端组件** | F |
| `src/components/CommandPalette.tsx` | 新增「查看全部结果」，跳转搜索页**携带 `?q=`** | G |
| `src/app/search/page.tsx`、`src/app/zh/search/page.tsx` | 读全部 searchParams → SSR 直出 | G |
| `src/app/blog/[slug]/page.tsx`、`src/app/zh/blog/[slug]/page.tsx` | 挂载推荐（替换 RelatedPosts，决策 D-03）；传 `language` | F |
| `src/app/projects/[slug]/page.tsx`、`src/app/zh/projects/[slug]/page.tsx` | 挂载推荐；传 `language` | F |
| `src/lib/adminMessages.ts` | 新增 `getAdminSearchAnalyticsMessages` | E |
| `src/i18n/messages/en.json`、`zh.json` | 新增 `admin.searchAnalytics` 命名空间（EN/ZH 成对，全文件 key 零漂移） | 双语 |

---

## 2. 关键设计与决策

### 2.1 两端一致性（决策 D-08 / D-11）

验收项 S18 要求「服务端 `/api/search` 与客户端命令面板对同一查询返回一致 id 序列」。
做到**可证明**的一致需要三件事：

1. **共用同一排序函数**：`src/lib/searchPipeline.ts` 的 `rankDocs`，服务端 `searchService`
   与客户端 `useSearch` 都调它（不是「两套实现尽量写一样」）。
2. **共用索引配置**：两侧都用 `createSearchIndex`（同一 `MINISEARCH_OPTIONS`）。
3. **时效基准按小时取整**：时效因子依赖当前时间，两侧各取 `Date.now()` 会因毫秒差
   在理论上翻转顺序。`rankingReferenceTime()` 把基准对齐到整点，两侧在同一天然小时内得到
   完全相同的值。

> 残留：仅在小时边界的毫秒内可能不一致。已在 spec §8.3 明示，并记入遗留清单。

### 2.2 结果列表的数据源（决策 D-11）

`/search` 页的**结果列表以服务端 props 为准**（URL 驱动、SSR 直出）；
`useSearch` 退居为「输入预览 / 命令面板」用途。若两侧都出结果，过滤与排序口径必然分叉，
这正是 S18/S19 最大的风险源。

### 2.3 限流桶模型（决策 D-07）

改造前 `rateLimit.ts` 只有一个全局桶（10 次/分钟/IP），评论、订阅、搜索共用一个预算。
现扩展为**命名桶**：
- 默认桶（不带参）行为与改造前**逐字节一致**，既有 4 个调用点零改动；
- `search` 桶 60/60s；`suggest` 桶 120/60s（评审 P2-4：建议每敲一键就请求，
  与搜索共用会把真实搜索挤出配额）；`admin-analytics` 桶 30/60s。

### 2.4 分析埋点覆盖真实入口（评审 P2-3）

初版只在 `/api/search` 埋点。但**真实访客走的是 `/search` 页面（SSR）**，
不经过该 API——那样运营看到的热门词只反映直接调 API 的流量，痛点 5 实际未被解决。
已改为 `loadSearchPageData` 同样记录（纯内存写、try/catch，不阻塞渲染）。

验证：
```
before kubernetes count = 0
$ curl -s -o /dev/null "http://localhost:3100/search?q=kubernetes"
$ curl -s -o /dev/null "http://localhost:3100/zh/search?q=kubernetes"
after  kubernetes count = 2
```

### 2.5 响应安全（S12）

`JSON.stringify` 不转义 `<` `>` `&`，把用户查询原样回显会让报文里出现字面量 `<script>`。
`safeJson.ts` 采用**无损转义**（`<`→`<` 等）：报文里不再有可执行片段，
而 JSON 解析后字符串与原文**完全一致**。已覆盖 value、key、astral 字符、
以及用户输入本身就是 `<` 六个字符等边界。

### 2.6 中文建议的长前缀（评审 P2-8）

初版 CJK 候选只有 bigram，用户输入第 3 个字（如「服务端」）时匹配不到任何候选、
建议突然消失。现补充「整段短语（≤12 字）」候选 + 「前缀包含候选」的反向匹配：

```
prefix=服      -> ["服务","中的服务端渲染与静态生成","微服","电商微服务架构","的服"]
prefix=服务     -> ["中的服务端渲染与静态生成","电商微服务架构"]
prefix=服务端    -> ["服务","中的服务端渲染与静态生成","务端"]      ← 改造前为空
prefix=服务端渲   -> ["服务","中的服务端渲染与静态生成","务端","端渲"]  ← 改造前为空
```

---

## 3. 批次 2 评审 P2 处置

| # | 问题 | 处置 |
|---|---|---|
| P2-1 | 打字可能被服务端回包覆盖 | ✅ 已修：仅在「本地无待提交编辑」时同步 |
| P2-2 | `buildUrl` 丢弃未知 query 参数 | ⏸ **接受**：spec 明确定义为 5 个状态键；保留未知参数需引入 `useSearchParams` 与 Suspense 边界，收益不抵风险。记入遗留 |
| P2-3 | 分析未覆盖真实 UI 搜索 | ✅ 已修（见 §2.4），并端到端验证 |
| P2-4 | 建议与搜索共用限流桶 | ✅ 已修：独立 `suggest` 桶 |
| P2-5 | admin 隐私文案与实际存储不符 | ✅ 已修：文案补上 locale / 筛选 / 结果数 |
| P2-6 | `cleanup` 用全局 `WINDOW_MS` | ✅ 已修：桶内记录自身 `windowMs` |
| P2-7 | 500 响应泄露 `error.message` | ✅ 已修：改为通用文案，细节只进服务端日志 |
| P2-8 | 中文建议对 ≥3 字前缀失效 | ✅ 已修（见 §2.6） |
| P2-9 | 部分测试偏弱 | ✅ 部分已修：新增时效加权**顺序**断言（移除 `applyRecencyWeight` 即失败）、12 项极端输入用例。S18 单元测试的局限已在下文说明 |
| P2-10 | 组件注释与实际不符 | ✅ 已修 |
| P2-11 | `sort=relevance` 写入 URL | ✅ 已修：归一化为不写入 |

> **关于 P2-9 中「S18 单元测试两边调同一个函数」的批评**：批评成立，该单元测试**不能**证明
> `useSearch` 没有分叉。因此额外做了**真实端到端 S18**：起 dev server，
> 一侧打 `/api/search`（完整服务层），另一侧打 `/api/search/index` 取文档后
> 在本地用 `createSearchIndex` + `rankDocs` 复现客户端口径，比对 id 序列。
> 脚本存档于 `deployment/run_s18_e2e.test.ts`，结果 **7/7 一致**（详见 deploy_report S18）。

---

## 4. 门禁证据

| 门禁 | 结果 | 证据 |
|---|---|---|
| scoped ESLint | 零 error | `ci_result/eslint_scoped_raw.txt`（0 字节） |
| `npm run build` | 成功 | `ci_result/ci_result.md` |
| `npm test` | 22 文件 / 313 用例全绿 | `ci_result/test_raw.txt` |
| 验收矩阵 | **S1–S24 全通过（23/23 脚本项 + S18 单独 e2e）** | `deployment/deploy_report.md` |
