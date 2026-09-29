# 需求评审报告 v1

- **变更**：feat-search-discovery-20260928
- **阶段**：阶段 2 需求评审
- **评审对象**：`request_analysis/spec.md` + `request_analysis/tasks.md`
- **评审人**：独立 reviewer subagent（未接触作者会话上下文）
- **评审轮次**：第 1 轮
- **结论**：🔴 **REJECTED**

> 说明：本次评审与作者的编码准备**并行**进行，reviewer 读取工作区时作者的
> `src/data/projects.ts`（新建）与 `src/data/blog.ts`（新增 3 篇）已经落盘，
> 因此评审报告中若干「spec 说要做 X，实际 X 已存在」的条目属于**时序观察**，
> 不构成 spec 缺陷。此类条目在 v2 中逐条标注为「已过时（评审期间作者已落盘）」。

---

## A. 需求覆盖度（A–G / S1–S24）

七个能力块 A–G 均有对应章节；S1–S24 矩阵在 `tasks.md` 逐条承接。覆盖度名义完整。缺口：

| # | 问题 | 级别 |
|---|---|---|
| A-1 | **过程交付物缺失**。需求方要求：每个能力块（A–G）完成时在 `summary.md` 追加交付小节；评审报告版本递增且旧版永不删除。spec §7 与 tasks T19 均未列 `summary.md` 维护与评审版本化任务。 | P2 |
| A-2 | **验收语言未钉死**——见 P1-2，导致 S2–S4 按字面无法通过。 | P1 |
| A-3 | admin 页无 ZH 镜像已给出理由（已核实：仅 `src/app/admin/{comments,content,notify}`，无 `src/app/zh/admin/`），与「双语同步规则只约束访客页」一致。 | ✅ 通过 |

## B. 技术正确性

**MiniSearch v7.2.0 能力——已确认支持**（`node_modules/minisearch/dist/es/index.d.ts`）：
- `SearchOptions.tokenize?: (text: string) => string[]`（L376）
- `SearchOptions.processTerm`（L402）、`combineWith`（L355）
- 构造期 `Options.tokenize` / `Options.processTerm`（L513 / L546）
- `search(query, searchOptions)` 支持逐次覆盖（L1234）

因此「自定义两侧分词 + 多次检索合并」方案**可行**。但有两处设计问题：

| # | 问题 | 级别 |
|---|---|---|
| B-1 | **spec §2A 自相矛盾**：`spec.md:74` 写「先 AND，若结果不足则降级 OR」，`spec.md:76` 写「按全 AND 与片段内 OR 两次检索后合并，取并集」。条件降级 vs 恒并集是两种语义。**恒并集对精度有实质伤害**：OR 展开到 unigram 时 `q=指南` 会命中任何含「指」或「南」的文档，直接威胁基准集的 `expectNoneOf` 断言。 | P1 |
| B-2 | **响应契约的 `id` 语义未定义**。现 `/api/search` 返回 `id: h.refId`（Notion id，`src/app/api/search/route.ts:45`），而客户端 `SearchHit.id` 是 `blog:<refId>`（`src/lib/searchIndex.ts:17`）。S18 要求「一致 id 序列」，两侧 id 口径不同则无法比较。 | P1 |
| B-3 | `force-dynamic` 的理由不准确：Route Handler 已读 `new Request(request.url)`，Next 14 下本就走动态渲染，`revalidate=600` 近乎失效。改动本身安全（`/api/search` 无仓内 fetch 消费者）。 | P2 |

## C. 规范符合性

| # | 结论 |
|---|---|
| C-1 | 不新建 `src/components` 子目录 ✅ |
| C-2 | 页面不内联 Notion SDK ✅（全部经 `src/services`） |
| C-3 | 不删除 `src/data` fallback ✅ |
| C-4 | 不引入新依赖 ✅ |
| C-5 | **i18n 判定：沿用 `searchTexts` 与既有实现一致，非违规**。已核实 `src/i18n/messages/{en,zh}.json` 无 `search` 命名空间，且项目明确未挂载 `NextIntlClientProvider`（`commentMessages.ts`/`subscribeMessages.ts`/`adminMessages.ts` 同一模式），`CommandPalette.tsx:31`、`SearchPageClient.tsx:28` 均消费 `searchTexts`。**但**新增 admin 分析页的文案方案未说明，须复用 `adminMessages.ts` 静态引入模式或补 `admin.*` key，否则构成真实的硬编码违规。 | P2 |
| C-6 | **类型放置**：`工程结构.md`「类型放置」要求跨模块共享类型入 `src/types/`，fallback 文件不得重复定义共享类型。spec 在 `src/data/projects.ts` 内定义 `ProjectType`、在 `src/lib/*` 定义 API 契约类型，未给出 `src/types/` 放置计划。 | P2 |

## D. 遗漏与风险

| # | 问题 | 级别 |
|---|---|---|
| D-1 | **详情页 fallback 的爆炸半径**：`getBlogPostById` 还被 `/api/content/[id]/preview` 使用，其契约明写「Notion 异常 → 404」（`src/app/api/content/[id]/preview/route.ts:39-43`）。加 seed fallback 后，空 Key 下传入 seed id 将由 404 变为可预览。`getAllProjects` fallback 亦会改变 `sitemap.ts:79` 与 `not-found.tsx:28` 的行为。spec 完全未提。 | P1 |
| D-2 | **`getAllProjects` 返回形状**：现返回 `{id,title,...,year}`，**无** `publishedAt`；而 `searchData.ts:66` 读 `project.date \|\| project.createdTime`，本地种子暴露的是 `publishedAt`。且 `src/app/projects/page.tsx:71` 把 `project.role` 直接传给 `ProjectCard`——适配层须把 `role`/`subtitle`/`description` 展平为字符串。spec §4 只写「适配层」，未写这些具体形状要求。 | P1 |
| D-3 | **限流单一全局桶**：`rateLimit.ts` 只有一个 `buckets` Map，仅按 IP 计数，`MAX=10`/60s，且 `api/comments`、`api/subscribe` 等已在共用。spec 写「分析记录复用独立宽松限流桶」——**用现有 API 无法表达**，必须扩展 `rateLimit.ts` 支持命名桶，而 spec/tasks 均未把它列为待改文件。 | P1 |
| D-4 | **测试隔离**：现有 11 文件 / 122 用例在 `singleFork` 下通过；**无任何既有测试 import `searchIndex`**，故「新分词器打破既有测试」的前提不成立。真实风险是新增的模块级单例（分析存储、索引缓存、限流桶）在同文件内共享状态——须为每个模块提供 reset 钩子。 | P1 |
| D-5 | **dev 下模块重载**：`next dev` 中不同 route bundle 可能是不同模块实例，`searchEventStore` 的模块级 Map 未必被 `/api/search`（写）与 `/api/admin/search-analytics`（读）共享 → S14/S15 会失败。须把存储与 `searchIndexCache` 钉到 `globalThis`。 | P1 |

## E. 范围纪律

无显著过度重构。新增模块均可追溯到 A–G。唯一范围关注点是 D-03（解除 `RelatedPosts` 挂载）——
需求 F 只要求「四处成对挂载」，未要求移除既有组件。做法可辩护，但属于**行为变更，需产品方显式签字**。 | P2 |

---

## P0（阻塞）

无「不可能实现」项；以下 P1 必须在编码前解决。

## P1（阻塞——按字面将导致验收失败）

1. **S24（20 次连续请求）与 S16/限流冲突**。`MAX=10`/60s/IP（`rateLimit.ts:11-13`），S24 的第 11–20 次将返回 429，p95 失去意义；S14（多次已知查询）同样有触发风险。spec 未声明 `/api/search` 的限额，「独立桶」用现有 API 无法表达。
   **修法**：扩展 `rateLimit.ts` 支持命名/可配置桶（列入待改文件），显式定义 `/api/search` 限额，S24 改用不同 `x-forwarded-for` 或对 loopback 豁免，并在报告中说明 429。
2. **语言过滤与 S2/S3/S4 默认语言冲突**。`getSearchDocuments` 丢弃 `language` 与请求语言不符的文档（`searchData.ts:71-73`），`locale` 默认 `en`。故 `/api/search?q=入门`（默认 en）返回 0。
   **修法**：逐条钉死基准集语言（S2–S4 用 `locale=zh`），并在 spec 给出确切 curl URL。
3. **S18 与时效加权冲突**。§2C 在服务端 `searchService` 叠加时效加权，而客户端 `useSearch → runSearch` 用原始 MiniSearch 分数、无时效项 ⇒ 同一查询两侧 id 序不同。
   **修法**：客户端路径也接同一排序管线，或明确 S18 以「加权前共享排序」为准并写明。
4. **`src/hooks/useSearch.ts` 未进任务清单**。G 要求 URL 驱动 `type/tag/sort/page` 与 SSR 直出，而 `useSearch` 无过滤/分页参数且硬编码 `runSearch(index, debounced, 30)`（`useSearch.ts:118`）。T16 列了 `SearchPageClient.tsx` 却没列它，导致「客户端过滤 vs 每次按键整页导航」未定义。
5. **分析存储跨路由不共享（S14/S15）**。见 D-5。**修法**：`globalThis` 钉住单例。

## P2（非阻塞）

- spec §4.2 / tasks T03 写「现有 11 篇」blog 种子——实际为 **10** 篇。
- spec §4.2 写「`BlogPostType` 新增可选 `tags`/`readTime`」——**已存在**（`src/data/blog.ts:69-79`）。〔时序观察〕
- spec §4.1 写「新建 `src/data/projects.ts`」——**文件已存在**（6 个项目）。〔时序观察〕
- `spec.md:74` vs `spec.md:76` 的 OR/AND 矛盾（见 B-1）。
- `spec.md:31` 称 MiniSearch「默认按空白分词」——v7 默认按**空白或标点**切分。
- 规范符合性：补 `src/types/` 放置说明；补 admin 分析页文案方案。
- `tasks.md` 缺 `summary.md` 维护与评审版本化任务。
- D-03 移除 `RelatedPosts` 属于行为变更，需显式产品签字。
- S24 缓存：`/api/search/index` 的 `revalidate=600` 因 `request.url` 实际已动态，S24 的「不重复构建」只能由新增的 `searchIndexCache` 满足——报告中须归因正确，不得归因于 ISR。
- `getSearchDocuments` 每请求调用，而 `getAllBlogPosts` 仅有 60s 列表缓存（`notion.ts:80`），故 5 分钟索引缓存确在起作用；TTL 须 ≥60s 保持一致。

---

## 事实更正表

| spec 陈述 | 实际情况 | 证据 |
|---|---|---|
| 「现有 11 篇」blog 种子保留 | 10 篇 | `grep -c "id: 'post" src/data/blog.ts` |
| `BlogPostType` 需新增 `tags`/`readTime` | 已新增 | `src/data/blog.ts:69-79` |
| 待新建 `src/data/projects.ts` | 已存在，6 个项目 | `src/data/projects.ts` |
| `/api/search` 的 `revalidate=600` 缓存搜索结果 | 已读 `request.url` → 本就走动态，revalidate 近失效 | `route.ts:18,30` |
| MiniSearch 默认「按空白分词」 | 按空白**或标点**切分 | `index.d.ts:490` |
| 全仓库无代码 import `@/data/blog` | 属实 | grep |
| `SmartRecommendations` 零挂载；`RelatedPosts` 在 EN/ZH 博客详情各一处 | 属实 | `blog/[slug]/page.tsx:274`、`zh/blog/[slug]/page.tsx:258` |
| 「分析记录复用独立限流桶」 | 现有单桶 API 无法表达 | `rateLimit.ts:13,42-52` |

**APPROVE 前必须修**：P1-1 ~ P1-5 + 事实更正 + `summary.md`/版本化交付物。
