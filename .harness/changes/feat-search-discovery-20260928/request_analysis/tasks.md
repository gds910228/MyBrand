# 任务拆分：全站搜索与内容发现 2.0

- **变更目录**：`.harness/changes/feat-search-discovery-20260928/`
- **依赖**：`request_analysis/spec.md`（APPROVED 后进入编码）
- **编码批次**：批次 1 = T01–T06（检索核心与数据层）；批次 2 = T07–T16（API 整合 / 前端 / 推荐 / 分析视图）

> 说明：仓库无 `.git`（需求方确认「仓库无 .git：以『改动文件清单』等价替代提交记录」）。
> 因此「原子提交」在本项目中等价为**原子任务 + 改动文件清单**，不产生 commit。

---

## 批次 1：检索核心与数据层

| ID | 任务 | 涉及文件 | 产出 |
|---|---|---|---|
| T01 | 基准集 fixture 固化 | 新建 `src/lib/__tests__/fixtures/searchBenchmark.json` | 12 条查询（en4/zh4/mixed4）+ 期望命中/排除 id |
| T02 | 项目本地种子 | 新建 `src/data/projects.ts` | ≥6 个项目，`{en,zh}` 双语 + technologies + publishedAt |
| T03 | 博客种子充实 | 修改 `src/data/blog.ts` | 新增 3 篇（覆盖 渲染 / 性能优化 / typescript generics）；既有 **10** 篇保留不删（v2 更正：原文误写 11 篇，全量应为 13 篇） |
| T04 | CJK 分词器 | 新建 `src/lib/cjkTokenizer.ts` | `tokenizeText(text)` / `tokenizeQuery(q)` / CJK 片段识别。纯函数 |
| T05 | 检索核心重写 | 修改 `src/lib/searchIndex.ts` | 接入 CJK tokenize（索引侧 unigram∪bigram / 查询侧仅 bigram，**全局 AND，不做 OR 降级**——见 spec §8.13，v2 更正）；保留 `runSearch`/`highlight`/`serializeIndex` 既有导出签名；新增 `runSearchAll` 供分页 |
| T06 | 排序与评分 | 新建 `src/lib/searchRanking.ts` | 时效加权 `applyRecencyWeight`、确定性比较器 `compareHits`、相关推荐评分 `scoreRelated`。纯函数 |
| T07 | 查询参数解析与过滤 | 新建 `src/lib/searchQuery.ts`、**`src/types/search.ts`**（v2 C-6 补入：跨层共享契约类型） | `parseSearchQuery(searchParams)` → 归一化参数 + 校验错误；`filterDocs`、`paginate`。纯函数 |
| T08 | 索引缓存 | 新建 `src/lib/searchIndexCache.ts` | 按 locale 进程内缓存索引（TTL 5min），`getCachedIndex(locale)`；**单例钉 `globalThis`**（v2 P1-5/D-09），供 S24 证据 |
| T09 | 数据层 fallback 适配 | 新建 `src/data/localContent.ts`；修改 `src/services/notion.ts` | 本地种子 → notion 服务形状适配 + HTML→Notion blocks；blog/project 四个读取函数空 Key 回落 |
| T10 | 检索服务层 | 新建 `src/services/searchService.ts` | `searchContent(params)` 统一入口（解析→缓存索引→过滤→排序→分页），供 API 与 SSR 页共用 |

> T07–T10 虽属批次 1 的「核心」范畴，但其中 T09/T10 触及数据层与 API 边界。
> **批次划分以评审轮次为准**：批次 1 = T01–T06（可独立评审的纯检索内核 + 数据种子），
> 批次 2 = T07–T16。T07/T08 在批次 1 评审通过后随批次 2 一同实现。

## 批次 2：API 整合 / 前端 / 推荐 / 分析视图

| ID | 任务 | 涉及文件 | 产出 |
|---|---|---|---|
| T11 | 搜索 API 全参数化 | 修改 `src/app/api/search/route.ts`、**`src/lib/rateLimit.ts`**（v2 P1-1 补入：命名桶） | 统一参数、分页元信息、400/空集容错、`search` 命名桶限流（60/60s/IP）、分析埋点 |
| T12 | 建议端点 | 新建 `src/app/api/search/suggest/route.ts` | 基于索引内容的前缀建议 + 静态兜底 |
| T13 | 分析存储与聚合 | 新建 `src/lib/searchAnalytics.ts`、`src/lib/searchEventStore.ts` | 脱敏事件、内存存储、`aggregateSearchEvents`；**存储钉 `globalThis`**（v2 D-5/D-09），含 `resetSearchEventsForTest` |
| T14 | 分析 admin API + 视图 | 新建 `src/app/api/admin/search-analytics/route.ts`、`src/app/admin/search-analytics/page.tsx` | 鉴权同 `/api/admin/comments`；热门词 / 零结果词 |
| T15 | 相关性推荐服务 + 组件重构 | 新建 `src/services/recommendations.ts`；重写 `src/components/SmartRecommendations.tsx` 为服务端组件 | SSR、语言感知、同类型优先 + 标签相似度、`reason` 字段 |
| T16 | 搜索页 URL 即状态（EN/ZH 成对）+ 命令面板 | 修改 `src/app/search/page.tsx`、`src/app/zh/search/page.tsx`、`src/components/SearchPageClient.tsx`、**`src/hooks/useSearch.ts`**（v2 P1-4 补入）、`src/components/CommandPalette.tsx`、`src/lib/searchIndex.ts`（searchTexts） | SSR 直出全部过滤/分页状态；**结果列表数据源=服务端 props，`useSearch` 仅作输入预览**（决策 D-11）；筛选控件写历史；建议词接入；命令面板带参跳转 |
| T17 | 详情页四处挂载推荐 | 修改 `src/app/blog/[slug]/page.tsx`、`src/app/zh/blog/[slug]/page.tsx`、`src/app/projects/[slug]/page.tsx`、`src/app/zh/projects/[slug]/page.tsx` | 四处成对挂载；blog 处替换 RelatedPosts（D-03） |
| T18 | 测试 | 新增 `src/lib/__tests__/{cjkTokenizer,searchIndex,searchRanking,searchQuery,searchAnalytics,searchBenchmark,localsSeed}.test.ts` 等 | 覆盖分词/解析过滤/排序确定性/建议/分析聚合/分页边界/推荐排序/基准召回 |
| T19 | 门禁与验收 | `ci_result/ci_result.md`、`deployment/deploy_report.md` | lint/build/test 真实输出；S1–S24 逐条 |

---

## 验收矩阵（S1–S24，逐条记录于 deploy_report.md）

### 检索质量
| 编号 | 要求 |
|---|---|
| S1 | `/api/search?q=nextjs` → 200，results 非空，每项含 title/type/score |
| S2 | 中文关键词（如 入门）→ 命中双语种子中对应文章 |
| S3 | `q=Next.js 入门` → 命中该文 |
| S4 | `q=指南` 或 `q=渲染` → 命中含该子串的种子文档（证明分词改造生效，非仅前缀匹配） |

### 查询与过滤
| 编号 | 要求 |
|---|---|
| S5 | `type=blog` 与 `type=project` 各一次，结果类型全对；非法 type → 400 或空结果 |
| S6 | `tag=<种子中存在的标签>` → 结果 keywords 均含该标签 |
| S7 | `from`/`to` → 结果日期全部在范围内 |
| S8 | type+tag+时间范围组合 → 结果同时满足全部条件 |

### 排序与分页
| 编号 | 要求 |
|---|---|
| S9 | `sort=newest` → 按 date 降序；默认 relevance |
| S10 | 同查询连发两次，结果 id 序列完全一致 |
| S11 | `page=2&pageSize=5` → 正确切片与总数元信息；越界 page → 空集不报错 |

### 健壮性
| 编号 | 要求 |
|---|---|
| S12 | `q=<script>alert(1)</script>`、超长字符串、纯空白 → 不 500，响应不含未转义可执行片段 |

### 建议与分析
| 编号 | 要求 |
|---|---|
| S13 | prefix 前缀请求 → 返回基于索引内容的建议列表 |
| S14 | 执行若干次已知查询后，分析端点能聚合出这些词及次数 |
| S15 | 构造无命中查询后，分析端点零结果词可见 |
| S16 | 短时高频请求搜索 API → 触发 429 |
| S17 | 分析端点鉴权与 `/api/admin/comments` 一致 |

### 一致性与 URL 状态
| 编号 | 要求 |
|---|---|
| S18 | `/api/search` 与 `/api/search/index`（客户端口径）对同一查询返回一致 id 序列 |
| S19 | `/search?q=…&type=blog` 的 SSR HTML 直出过滤后结果；URL 可直接分享访问 |

### 双语与推荐
| 编号 | 要求 |
|---|---|
| S20 | `/search` 与 `/zh/search`（带查询词）→ 200，HTML 含本地化文案与结果元素 |
| S21 | blog 与 project 详情页 SSR HTML 含相关内容区块且条目非空 |
| S22 | 抽查 2 篇文章的相关推荐，与原文共享标签或主题（含推荐理由字段） |

### 回归与性能
| 编号 | 要求 |
|---|---|
| S23 | 旧参数 `?language=Chinese\|English` 兼容不回归；`/api/comments`、`/api/projects`、`/api/admin/comments` 状态码与关键字段不回归 |
| S24 | 索引构建有缓存（连续请求不重复构建）；给出 20 次连续请求耗时（含 p95）+ 缓存策略说明 |

---

## 测试清单（阶段 5）

| 测试文件 | 覆盖点 |
|---|---|
| `src/lib/__tests__/cjkTokenizer.test.ts` | CJK 片段识别、unigram+bigram、中英混排、空串/纯标点/emoji、超长片段上限 |
| `src/lib/__tests__/searchIndex.test.ts` | 索引构建、中英/混合检索召回、非词头中文子串、`runSearch` 归一化、`highlight` XSS 转义 |
| `src/lib/__tests__/searchRanking.test.ts` | 时效加权单调性、确定性比较器（同分按 id）、推荐评分（同类型优先 + 标签相似度 + reason） |
| `src/lib/__tests__/searchQuery.test.ts` | 参数解析默认值/非法值、type/tag/from/to 过滤、分页边界（page=0/负数/越界/超大 pageSize） |
| `src/lib/__tests__/searchAnalytics.test.ts` | 事件脱敏（无 IP/UA）、截断、聚合热门词与零结果词、确定性排序、空存储 |
| `src/lib/__tests__/searchSuggest.test.ts` | 前缀建议基于索引内容、静态兜底、limit 边界 |
| `src/lib/__tests__/searchBenchmark.test.ts` | 12 条基准查询召回（zh/mixed/en 三类命中期望文档，且无 expectNoneOf 误召回） |
| `src/lib/__tests__/localSeeds.test.ts` | 种子数据完整性：≥6 项目、双语字段齐全、technologies 非空、id 唯一、基准集引用的 id 均存在 |
| `src/lib/__tests__/searchI18n.test.ts` | `searchTexts` EN/ZH key 完全对齐 |

---

## v2 补入任务（响应 `review/spec_review_v1.md`）

| ID | 任务 | 涉及文件 | 产出 |
|---|---|---|---|
| T20 | 过程交付物维护（v2 A-1） | `.harness/changes/feat-search-discovery-20260928/summary.md` | 每阶段完成即更新状态；**每能力块 A–G 完成时追加交付小节（改动文件清单 + 门禁证据指针）** |
| T21 | 评审版本化（v2 A-1） | `request_analysis/review/`、`coding/review/`、`unit_test/review/` | 每轮评审独立文件、版本递增、**旧版永不删除**；不通过须真实打回重做 |
| T22 | 基线对照复测（v2） | `deployment/deploy_report.md` | 用同一基准集复测，产出 before/after 对照表；中文与混合查询召回须有可见改善，英文查询不得回归 |

## 验收口令修订（v2 P1-2）

基准集与验收矩阵中，**中文与中英混合查询一律显式携带 `locale=zh`**，
英文查询携带 `locale=en`。原因：`getSearchDocuments` 按 `language` 过滤索引文档
（`src/services/searchData.ts:71-73`），`locale` 决定检索哪一套语言索引。
不显式传 `locale` 时默认 `en`，中文查询将命中 0 条——这不是检索缺陷，而是验收口令未钉死语言。
