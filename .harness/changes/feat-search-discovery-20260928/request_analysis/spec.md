# 需求规格说明：全站搜索与内容发现 2.0

- **变更目录**：`.harness/changes/feat-search-discovery-20260928/`
- **类型**：feat
- **阶段**：阶段 1 需求分析产出
- **状态**：✅ 已完成（阶段 2 评审见 `request_analysis/review/`）

---

## 1. 背景

MisoTech 是 Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS 的作品集 + 博客站点，
Notion 为 Headless CMS，EN（根路由）/ ZH（`/zh/` 镜像）双语。

现有搜索栈：
| 文件 | 职责 |
|---|---|
| `src/lib/searchIndex.ts` | MiniSearch 索引配置 + `runSearch` + `highlight` + `searchTexts`/`popularSearches` 文案 |
| `src/services/searchData.ts` | 由 blog/project 列表元数据构建 `SearchDoc[]` |
| `src/app/api/search/route.ts` | 服务端兜底搜索，硬编码 `limit 20` |
| `src/app/api/search/index/route.ts` | 下发序列化文档集供客户端建索引 |
| `src/hooks/useSearch.ts` | 客户端索引加载（模块级缓存）+ 检索 |
| `src/components/CommandPalette.tsx` | ⌘K 命令面板 |
| `src/components/SearchPageClient.tsx` | `/search`、`/zh/search` 交互层 |
| `src/components/SmartRecommendations.tsx` | 287 行半成品推荐组件（**全站零挂载**） |

### 1.1 需求方陈述的八项痛点

1. 中文/中英混合查询质量差——MiniSearch 默认按空白分词，中文短语成为单个长 token，只能词头前缀命中。
2. 无结构化过滤（类型/标签/时间范围），无分页（服务端硬编码 limit 20）。
3. 无时效排序选项；同分排序稳定性不可控。
4. 搜索建议词是写死的 `popularSearches` 静态数组。
5. 无搜索行为分析。
6. `/api/search` 未接入限流（`src/lib/rateLimit.ts` 基建已存在）。
7. `SmartRecommendations` 是半成品：客户端整库拉取、从 URL 路径提取伪关键词、语言硬编码 English。
8. 搜索页状态不进 URL。

### 1.2 现状核验（编码前实测，与需求方陈述的差异）

> 本项目要求「变更前必须先理解现有代码，不臆断结构」。核验中发现**两处与需求方陈述不符的事实**，
> 直接影响验收路径，在此显式记录。

| # | 需求方陈述 | 实测事实 | 影响 |
|---|---|---|---|
| V-1 | 「空 Key 时降级到 `src/data` 本地 fallback（`src/data/blog.ts` 内置 en/zh 双语种子文章）」 | **不成立**。`src/services/notion.ts` 仅从 `@/data/comments` 引入本地兜底；`getAllBlogPosts` 在空 Key 下 Notion 查询抛错 → `catch` 返回 `[]`（`notion.ts:878-881`）。全仓库无任何代码 import `@/data/blog`（`blogPosts` 导出为零引用死数据）。 | 空 Key 下端到端搜索索引为 **0 文档**，12 条基准查询召回 **0/12**。必须补齐 blog + project 本地 fallback，否则 S1–S24 全数无法达成。 |
| V-2 | 「`SmartRecommendations` 是半成品」 | 成立，且更严重：该组件**在全站零挂载**（`grep` 无任何页面引用）。博客详情页当前用的是另一个组件 `RelatedPosts`（EN/ZH 各一处）。 | 能力块 F 的「四处成对挂载」是**从零挂载**，不是改造既有挂载点。 |

实测证据：
```
$ curl -s "http://localhost:3100/api/search/index?locale=en"
{"locale":"en","count":0,"documents":[]}

$ curl -s "http://localhost:3100/api/search?q=nextjs"
{"results":[],"count":0,"query":"nextjs"}
```
（完整 12 条基线见 `baseline_report.md`）

---

## 2. 功能描述（按能力块 A–G）

### A. 检索质量：CJK / 中英混合分词与检索

**要求**：中文词、英文词、中英混合词、中文非词头子串四类查询均有稳定召回。

**方案**（v2 已按 `review/spec_review_v1.md` B-1 修订）：自定义 MiniSearch `tokenize` + `processTerm`，实现 CJK 感知分词。
**经 MiniSearch 7.2.0 类型定义核实**：`Options.tokenize` / `Options.processTerm`（索引侧）与
`SearchOptions.tokenize` / `SearchOptions.processTerm`（查询侧）可分别配置，且 `processTerm`
允许返回 `string[]`（`node_modules/minisearch/dist/es/index.d.ts` L376 / L402 / L513 / L546）。

- 对文本按「CJK 片段 / 非 CJK 片段」交替切分（`src/lib/cjkTokenizer.ts` 的 `segmentText`），
  识别 Han（基本区 + 扩展 A + 兼容区）、日文假名、韩文谚文。
- 非 CJK 片段：沿用原有归一化（小写、去 `._/-`），按非字母数字边界切词，使
  `Next.js` / `nextjs` / `Next JS` 等价。
- **索引侧**（`expandForIndex`）：CJK 片段 → **unigram ∪ bigram**。
  「入门指南」→ `入 门 指 南 | 入门 门指 指南`。unigram 保证单字查询可召回，bigram 保证多字词按序命中。
- **查询侧**（`expandForQuery`）：CJK 片段 → **仅 bigram**（长度 ≥2；长度为 1 时产出该单字）。
  「入门」→ `["入门"]`；「性能优化」→ `["性能","能优","优化"]`。
- `combineWith: 'AND'` 保持，**不做 OR 降级**。
- 单 CJK 片段长度上限 `MAX_CJK_RUN_LENGTH = 128`，防止超长无空格中文串导致索引膨胀。

> **B-1 修订说明（两方案矛盾 → 收敛为单方案）**：v1 spec 同时写了「AND 不足时降级 OR」与
> 「全 AND 与片段内 OR 两次检索取并集」两种互相矛盾的语义。**最终采纳 bigram-AND 单方案，
> 不引入任何 OR 降级**。理由：查询侧只用 bigram、不用 unigram，精度已足够；而 OR 一旦展开到
> unigram，`q=指南` 会命中任何含「指」或「南」的文档，直接破坏基准集的 `expectNoneOf` 断言。
> 该设计已冒烟验证（见下）。

**冒烟验证**（`src/lib/__tests__/scratch.smoke.test.ts`，编码期一次性脚本，交付前删除）：
```
qry 入门       = [ '入门' ]
qry 性能优化   = [ '性能', '能优', '优化' ]
queryTokens("Next.js 入门") = [ 'nextjs', '入门' ]

指南             => [ 'blog:post-11', 'blog:post-1' ]
渲染             => [ 'blog:post-10' ]
性能优化          => [ 'blog:post-12' ]
Next.js 入门     => [ 'blog:post-1' ]
Tailwind 响应式   => [ 'blog:post-2' ]
nextjs           => [ 'blog:post-1', 'blog:post-10' ]
docker           => [ 'project:proj-3' ]
```
即英文 / 中文词 / 中英混合 / 中文非词头子串四类查询均稳定召回。

**验收**：基准集 12 条（en 4 / zh 4 / mixed 4）全部满足 `expectAnyOf` 且无 `expectNoneOf` 误召回；跑分见 deploy_report 对照表。

### B. 查询能力：统一查询参数

`GET /api/search` 统一参数：

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `q` | string | `''` | 自由文本。空/纯空白 → 空结果集（200，不报错） |
| `type` | `blog`\|`project` | 不限 | 非法值 → 400 |
| `tag` | string | 不限 | 大小写不敏感，匹配 `keywords` 数组任一元素 |
| `from` | `YYYY-MM-DD` | 不限 | 含边界，`date >= from` |
| `to` | `YYYY-MM-DD` | 不限 | 含边界，`date <= to` |
| `locale` | `en`\|`zh` | `en` | 兼容旧 `language=Chinese\|English` |
| `sort` | `relevance`\|`newest` | `relevance` | 非法值 → 400 |
| `page` | int ≥ 1 | `1` | 非法/越界 → 空集，不报错 |
| `pageSize` | int 1..50 | `20` | 超范围 → clamp 到边界（不报错） |

**响应契约**（向后兼容：保留 `results`/`count`/`query`）：
```jsonc
{
  "results": [ /* 项含 id, slug, title, excerpt, type, date, score, tags|technologies */ ],
  "count": 20,            // 本页条数（旧字段，语义不变=当前页长度）
  "query": "nextjs",
  "total": 137,           // 过滤后总数（新增）
  "page": 1,
  "pageSize": 20,
  "totalPages": 7,
  "sort": "relevance",
  "filters": { "type": null, "tag": null, "from": null, "to": null },
  "tookMs": 3
}
```

**容错**：任何非法输入 → 400（参数语义错误）或空结果（越界/空查询），**绝不 500**。

### C. 排序

- `sort=relevance`（默认）：`score` 降序，叠加**时效加权**（新内容加成）。加权公式见 `src/lib/searchRanking.ts`：
  `finalScore = score * (1 + RECENCY_WEIGHT * recencyFactor)`，其中 `recencyFactor = exp(-ageDays / HALF_LIFE_DAYS)`，`HALF_LIFE_DAYS = 180`，`RECENCY_WEIGHT = 0.3`。加权只在 relevance 排序下生效。
- `sort=newest`：`date` 降序。
- **确定性**：两种排序均以 `id` 升序作为**最终 tiebreaker**，保证同一查询两次调用 id 序列完全一致。

### D. 搜索建议

新增 `GET /api/search/suggest?prefix=<str>&locale=<en|zh>&limit=<n>`：
- 基于**当前索引内容**产出前缀建议：从索引文档的 `title` / `keywords` 中抽取候选词条（英文按词、中文按 bigram 合并出的词组），过滤出以 `prefix` 开头（大小写不敏感；CJK 用「包含」而非「开头」以适配中文无词边界）的候选。
- 按「命中文档数 × 词条权重」降序，`limit` 默认 8，最大 20。
- 静态 `popularSearches` 保留为**兜底**：索引为空或前缀为空时返回静态热门词。
- 响应：`{ prefix, locale, suggestions: [{ text, count }], source: 'index'|'fallback' }`

### E. 搜索分析

- **记录**：`src/lib/searchAnalytics.ts`，纯函数聚合 + 可插拔存储。
  - 存储接口 `SearchEventStore`：`record(event)` / `list()` / `clear()`。
  - 空 Key（无 `NOTION_API_KEY`）→ 使用**进程内内存存储**（Map），符合「空 Key 降级为内存存储即可」。
  - 事件字段**脱敏**：只存 `query`（截断至 100 字符）、`locale`、`resultCount`、`timestamp`、`type/tag/sort` 过滤维度；**不存 IP、不存 UA、不存任何用户标识**。
  - **不阻塞主查询**：`/api/search` 中 `void recordSearchEvent(...)`（fire-and-forget，包 try/catch），失败仅 `console.warn`。
  - **限流**：分析记录复用一个独立的宽松限流桶（避免把记录侧限流误伤主查询）；分析端点自身接入 `rateLimit`。
- **聚合**：`aggregateSearchEvents(events)` → `{ topQueries, zeroResultQueries, totalSearches, uniqueQueries }`，按次数降序 + 词条字典序 tiebreaker（确定性）。
- **admin 视图**：新增 `GET /api/admin/search-analytics`，鉴权走 `checkAdminAccess`，与 `/api/admin/comments` 完全一致（无 token → 401；`ADMIN_TOKEN` 未配置时仅 localhost 放行）。
- **admin 页面**：`/admin/search-analytics`，服务端组件 + 客户端拉取，展示热门词 / 零结果词两张表。

### F. 相关内容推荐升级

将 `SmartRecommendations` 重构为**服务端组件**，基于统一检索层：

- **服务端 SSR**：改为 `async` 服务端组件，直接调用 `src/services/recommendations.ts` 的 `getRelatedContent()`，无 `useEffect`、无客户端整库拉取。
- **统一检索层**：复用 `getSearchDocuments()`（与服务端搜索同源）+ `src/lib/searchRanking.ts` 的评分函数，取代原来从 URL 路径提取关键词的伪逻辑。
- **语言感知**：以 `locale` prop 驱动，EN/ZH 各自取对应语言的索引文档。
- **排序规则**：同类型优先（blog 推荐 blog、project 推荐 project，同类型加权）→ 标签相似度（Jaccard + 交集计数）→ 时效衰减 → `id` tiebreaker。
- **推荐理由**：每个条目输出 `reason` 字段（如 `shared tags: nextjs, react`），供 UI 展示，同时便于 S22 验收。
- **挂载**：blog 详情页 EN/ZH + project 详情页 EN/ZH **四处成对挂载**。
  - **决策 D-03**：博客详情页原挂载的 `RelatedPosts` 由重构后的 `SmartRecommendations` **替换**（避免同页出现两个语义重复的「相关内容」区块，也避免重复服务端计算）。`RelatedPosts.tsx` 文件**保留不删**。

### G. 搜索 URL 即状态

- `/search` 与 `/zh/search` 的状态（`q` / `type` / `tag` / `sort` / `page`）**全部由 URL query 驱动**。
- **SSR 首屏按 URL 直出**：`page.tsx` 读取全部 searchParams，调用服务端检索（`src/services/searchService.ts`），把结果 + 分页元信息作为 props 传给客户端组件。
- 客户端筛选控件变更 → `router.push`（**不是 replace**）以写入历史，使浏览器回退可逐步回退筛选状态。
- 输入框打字 → 防抖后 `router.replace`（不污染历史，避免每个字符一条历史记录）。
- **命令面板**跳转 `/search` 时携带 `?q=`；面板内 Enter 仍直接跳详情页（保持既有行为），另提供「查看全部结果」入口跳搜索页并带参数。

---

## 3. 影响面

### 3.1 影响的页面（EN/ZH 成对）

| 页面 | EN | ZH | 变更 |
|---|---|---|---|
| 搜索页 | `src/app/search/page.tsx` | `src/app/zh/search/page.tsx` | 改为读取全部 searchParams + SSR 直出 |
| 博客详情 | `src/app/blog/[slug]/page.tsx` | `src/app/zh/blog/[slug]/page.tsx` | 挂载重构后的相关性推荐 |
| 项目详情 | `src/app/projects/[slug]/page.tsx` | `src/app/zh/projects/[slug]/page.tsx` | 挂载相关性推荐 |
| Admin 分析 | `src/app/admin/search-analytics/page.tsx` | —（admin 无 ZH 镜像，沿用现有 `/admin/*` 单语惯例） | 新建 |

> admin 区域现有 `src/app/admin/{comments,content,notify}` 均无 ZH 镜像，新增分析页遵循该既有惯例（Rules「双语同步」约束的是面向访客的页面）。

### 3.2 Notion 数据结构影响

**无**。不新增/修改任何 Notion 数据库字段，不写入 Notion。分析数据在空 Key 下走内存存储。

### 3.3 ISR / 缓存影响

- `/api/search` 现为 `revalidate = 600`。新增查询参数与限流后必须改为**动态**（`export const dynamic = 'force-dynamic'`），否则带参请求会被静态化，且限流无意义。
- 搜索索引构建引入**进程内缓存**（`src/lib/searchIndexCache.ts`），键为 `locale`，TTL 5 分钟，与服务端渲染解耦；`/api/search/index` 保留 ISR。
- 详情页 `revalidate = 300` 不变；相关性推荐作为服务端组件参与同一 ISR 周期。

### 3.4 新增依赖

**无**。全部基于既有 `minisearch` / `date-fns` / Next.js 内置能力实现。（Rules：不引入新依赖前先确认 `package.json` 是否已有替代。）

---

## 4. 数据层补齐（前置依赖）

> 由 §1.2 V-1 导出：不补齐则所有验收项无法达成。

1. **新建 `src/data/projects.ts`**：≥6 个项目，`{en, zh}` 双语字段齐全（title / description / subtitle / role / client），`technologies` 齐全，`publishedAt`、`slug`、`category`、`featured`、`coverImage`、`projectUrl`、`githubUrl` 齐全。遵循 `src/data/blog.ts` 既有模式。
2. **充实 `src/data/blog.ts`**：现有 11 篇保留不动（Rules：不删除既有 fallback 数据），**新增** 3 篇以覆盖基准集所需的中文非词头子串（渲染 / 性能优化）与英文关键词（typescript generics）。为缺少 `tags` 的既有文章在适配层用 `categories` 兜底，`BlogPostType` 新增可选 `tags`/`readTime` 字段（**可选**，不破坏既有数据）。
3. **把 fallback 接到 `src/services/notion.ts`**：
   - `getAllBlogPosts` 空 Key/异常 → 回落本地种子（按 `language` 取 `{en|zh}` 字段）。
   - `getBlogPostById` 空 Key/异常 → 回落本地种子详情（`content` 由 HTML 转 Notion 形状 block）。
   - `getAllProjects` 空 Key/异常 → 回落本地种子。
   - `getProjectBySlug` / `getProjectById` 空 Key/异常 → 回落本地种子。
   - 遵循 `src/data/comments.ts` 已确立的「`src/data` 即本地兜底层」架构。

---

## 5. 验收标准

### 5.1 功能验收

对应需求方给出的 S1–S24 验收矩阵，逐条在 `deployment/deploy_report.md` 记录
（编号 / curl 命令 / 响应要点 / 结论）。矩阵原文见 `tasks.md` §验收矩阵。

### 5.2 质量门禁（全部需要真实命令输出）

| 门禁 | 判据 |
|---|---|
| scoped ESLint | 本次新增/修改文件 `npx eslint <files>` **零 error**；全量 `npm run lint` 的历史遗留 error 不清零但**不得新增** |
| 构建 | `npm run build` 成功 |
| 测试 | `npm test` 全绿；新增测试覆盖：分词器、查询解析/过滤、排序确定性、搜索建议、分析聚合、分页边界、相关推荐排序；基准集 fixture 有召回测试 |
| 双语 | `searchTexts` 的 EN/ZH key 完全对齐（有测试断言） |

### 5.3 基线对照（强制）

- 改造前基线：`baseline_report.md`（端到端 0/12 + 检索层隔离基线）
- 改造后复测：`deployment/deploy_report.md` 的 before/after 对照表
- **硬性结论**：中文与混合查询召回必须有可见改善；英文查询不得回归。

---

## 6. 决策记录（HITL，单次执行模式）

| ID | 待决议项 | 候选方案 | 采纳结论 | 依据 |
|---|---|---|---|---|
| D-01 | 仓库 `.env.local` 含真实 Notion/Resend/EmailJS/VAPID/GA/AdSense 凭据，沙箱禁止访问外部服务 | (a) 原样保留，靠代码不触发；(b) 置空全部外部密钥，备份原件 | **(b)** | 需求方明令「不得访问真实外部服务」「严禁向真实外部服务写入任何数据」。原样保留存在误触发风险（如 dev server 预热、构建期预渲染）。原件备份至 `.harness/.env.local.original-with-real-keys.bak`（该文件名不被 Next.js 加载） |
| D-02 | `ADMIN_TOKEN` 是否一并置空 | (a) 置空 → S17 走 localhost 放行分支；(b) 保留本地占位 token | **(b)** | 保留占位 token 使 S17 能以确定性方式对照 `/api/admin/comments`（无 token → 401），比依赖 localhost 分支更严格。值为非真实凭据 |
| D-03 | 博客详情页已有 `RelatedPosts`，F 要求 `SmartRecommendations` 四处挂载 | (a) 两者并存；(b) 用 SmartRecommendations 替换 RelatedPosts | **(b)** | 同页两个语义重复的「相关内容」区块是 UX 缺陷且重复服务端计算；F 明确 SmartRecommendations 为统一推荐模块。`RelatedPosts.tsx` 文件保留不删 |
| D-04 | 中文多字词 AND 语义导致漏召回 | (a) 全 AND；(b) 同一 CJK 片段内 bigram 用 OR、片段间用 AND | **(b)** | 「性能优化」拆成 3 个 bigram 后全 AND 要求文档同时含全部 bigram，长词召回脆弱；片段内 OR 保证召回上界，片段间 AND 保证精度 |
| D-05 | 基线如何做到「可归因」 | (a) 只做端到端基线；(b) 端到端 + 检索层隔离基线 | **(b)** | V-1 发现数据层根本没接 fallback，端到端基线 0/12 无法区分「数据缺失」与「分词差」两个成因。隔离基线固定语料、只换检索实现，才能证明 A 能力块真实改善 |
| D-06 | 是否引入新检索依赖（如 flexsearch/lunr/分词库） | (a) 引入中文分词库（nodejieba 等）；(b) 基于既有 minisearch 自研 CJK 分词 | **(b)** | Rules 明令不引入新依赖前先确认既有替代；nodejieba 等含原生编译，沙箱构建风险高。bigram + unigram 是 CJK 检索的成熟无词典方案，可测试、零依赖 |

---

## 7. 范围边界

**做**：A–G 七个能力块、数据层 fallback 补齐、基准集 fixture、上述全部测试与文档。

**不做**（明确排除，避免范围蔓延）：
- 不重构 `src/data/comments.ts`、评论/订阅/推送等无关模块。
- 不修改 Notion 数据库结构或写入 Notion。
- 不引入向量检索 / 语义 embedding（无外部服务可用，且超出需求）。
- 不重写 `RelatedPosts.tsx` 内部实现（仅解除挂载）。
- 不改动 admin 现有三个页面。
- 不修复全量 lint 的历史遗留 error（仅保证不新增）。

---

## 8. v2 修订记录（响应 `request_analysis/review/spec_review_v1.md`）

> 本节**逐条**响应 v1 评审。凡与上文冲突者，**以本节为准**（保留原文以便追溯，符合「旧版本永不删除」惯例）。

### 8.1 P1-1 限流：S16 / S24 与既有单桶限流冲突

**问题确认（属实）**：`src/lib/rateLimit.ts` 只有**一个**全局 `buckets` Map，仅按 IP 计数，
`MAX = 10` / 60s（`rateLimit.ts:11-13`），且 `api/comments`、`api/subscribe` 等已在共用。
S24 要求 20 次连续请求，第 11–20 次必然 429，p95 无意义；「独立宽松桶」用现有 API 无法表达。

**修订**：
1. **修改 `src/lib/rateLimit.ts`**（v1 未列为待改文件，现补入）：在不破坏既有调用的前提下扩展为
   **命名桶**：
   - 保留既有签名 `rateLimited(ip: string): boolean`（等价于默认桶，`max=10`/60s），
     既有 `api/comments` / `subscribe` 等调用点**零改动**。
   - 新增 `rateLimited(ip: string, opts?: { bucket?: string; max?: number; windowMs?: number })`。
   - 新增 `resetRateLimitForTest(bucket?: string)`，供单测隔离。
2. **`/api/search` 使用命名桶 `search`，限额 `60 次 / 60s / IP`**（搜索是只读高频接口，10/min 过严）。
3. **验收口径**（写死，避免互相干扰）：
   - **S24（20 次连续请求测 p95）**：使用**独立的 `x-forwarded-for`**（如 `10.0.0.24`），
     其桶预算独立于其它验收项，20 次全部预期 200。
   - **S16（触发 429）**：使用**另一个独立 `x-forwarded-for`**（如 `10.0.0.16`），
     连发 61 次，第 61 次起预期 429。
   - 两者互不影响，且不污染 S1–S15 / S17–S23 所用的默认 IP 预算。
4. **分析写入**不使用搜索桶（否则记录侧限流会误伤主查询）：分析埋点在 `/api/search` 内部
   fire-and-forget，自身**不再二次限流**；分析**读取端点** `/api/admin/search-analytics` 走
   `rateLimited(ip, { bucket: 'admin-analytics', max: 30, windowMs: 60_000 })`。

### 8.2 P1-2 语言过滤 × 验收语言

**问题确认（属实）**：`getSearchDocuments` 按 `language` 过滤（`src/services/searchData.ts:71-73`），
`locale` 默认 `en`，故 `/api/search?q=入门`（不传 locale）在 en 索引下返回 0。

**修订**：
1. 基准集 fixture 已逐条标注 `locale`（`src/lib/__tests__/fixtures/searchBenchmark.json`）：
   en 4 条 → `locale=en`；zh 4 条 + mixed 4 条 → `locale=zh`。
2. **验收矩阵 curl 命令一律显式携带 `locale`**，S2 / S3 / S4 固定为 `locale=zh`。
3. 文档中明确：`locale` 决定「检索哪一套语言的索引」，与界面语言一致；跨语言检索不在本需求范围内。

### 8.3 P1-3 + B-2 排序一致性（S18）与 id 语义

**问题确认（属实）**：① v1 在服务端叠加时效加权、客户端 `useSearch → runSearch` 用原始分数，
两侧 id 序会不同；② `/api/search` 返回 `id: refId`（Notion id），而客户端 `SearchHit.id` 是
`blog:<refId>`，两侧 id 口径不同，S18 无法比较。

**修订**：
1. **统一 id 口径**：`SearchHit.id`（= `<type>:<refId>`）为**全局唯一文档 id**，服务端与客户端一致。
   `/api/search` 响应项**同时**返回：
   - `id`：`<type>:<refId>`（新口径，供 S18 比较与稳定 key）
   - `refId`：原始 Notion/种子 id（**兼容旧口径**，旧字段语义保留）
   - `slug` / `title` / `excerpt` / `type` / `date` / `score`（不变）
   > 兼容性说明：仓内无任何 fetch `/api/search` 的消费者（已核实：`SearchPageClient` 与
   > `CommandPalette` 均经 `useSearch` → `/api/search/index`），故此变更为纯增量。
2. **统一排序管线**：新增 `src/lib/searchRanking.ts` 作为**唯一**排序实现，服务端
   `searchService` 与客户端 `useSearch` **共用**同一套 `applyRecencyWeight` + `sortHits`。
3. **确定性时效基准**：时效因子依赖「当前时间」，若服务端与客户端各取 `Date.now()`，
   两侧结果在理论上可能因毫秒差而翻转。为让 S18 成为**可证明**的相等而非「几乎相等」，
   引入 `rankingReferenceTime(now)` = **按小时取整**的时间戳
   （`Math.floor(now / 3600000) * 3600000`），服务端与客户端均使用该值作为时效基准。
   两侧仅在同一小时边界的毫秒内可能不一致（可忽略，且在报告中明示）。
4. **B-3 更正**：v1 称「不改 force-dynamic 会被静态化」不准确——Route Handler 已读
   `request.url`，Next 14 下本就走动态渲染，`revalidate = 600` 近乎失效。**仍将显式声明
   `export const dynamic = 'force-dynamic'`**，但理由是「显式表达意图 + 让限流行为确定」，
   而非「修复静态化」。

### 8.4 P1-4 `src/hooks/useSearch.ts` 纳入任务

**问题确认（属实）**：v1 的 T16 未列 `useSearch.ts`，导致「客户端过滤 vs 整页导航」未定义。

**修订**——明确职责切分：
- **`/search` 页的权威状态源是 URL**。所有 `type` / `tag` / `sort` / `page` 维度与 `q` 的
  提交都走 `router.push`（写历史），由**服务端 SSR 重新检索并直出**（能力块 G）。
- `useSearch` 仅用于**输入框即时反馈**（打字时的下拉建议与轻量预览），
  **不再作为结果列表的数据源**；结果列表完全来自服务端 props，避免两套排序/过滤口径分叉。
- `useSearch` 新增可选入参 `{ type, tag, sort }`，使其预览口径与服务端一致（仍共用
  `searchRanking`）。`CommandPalette` 继续使用 `useSearch`（其定位是快速跳转，不做分页/时间过滤）。
- **T16 待改文件补入 `src/hooks/useSearch.ts`**。

### 8.5 P1-5 (D-5) 内存存储跨路由实例不共享

**问题确认（属实）**：`next dev` 下不同 route 可能是不同模块实例，模块级 `Map` 未必被
`/api/search`（写）与 `/api/admin/search-analytics`（读）共享 → S14/S15 会失败。

**修订**：`searchEventStore` 与 `searchIndexCache` 的单例**钉在 `globalThis`** 上
（`globalThis.__misotech_search_event_store__` / `__misotech_search_index_cache__`），
并在报告中明确标注：**内存实现仅适用于 dev / 单实例**；多实例生产环境需换持久化存储
（列入遗留问题清单）。

### 8.6 D-1 数据层 fallback 的爆炸半径

**问题确认（属实）**：`getBlogPostById` 亦被 `/api/content/[id]/preview` 使用，其契约写明
「Notion 异常 → 404」（`src/app/api/content/[id]/preview/route.ts:39-43`）；
`getAllProjects` fallback 亦影响 `sitemap.ts:79`、`not-found.tsx:28`。

**修订**：
1. fallback **仅在「Notion 未配置或调用失败」时生效**，即**恰好是原本返回 `null`/`[]` 的路径**，
   不改变 Notion 正常可用时的任何行为。
2. 空 Key 下 `/api/content/[id]/preview` 对**种子 id** 由 404 变为可预览——这是**预期内的行为改善**
   （本地开发可用），对**非种子 id** 仍为 404。记入 deploy_report 的「行为变更」小节。
3. `sitemap.ts` 与 `not-found.tsx` 在空 Key 下将获得 6 个本地项目——同样为预期内改善；
   S23 回归组须确认**状态码不回归**（200/404 语义不变）。

### 8.7 D-2 适配层返回形状必须对齐既有消费方

**问题确认（属实）**：`getAllProjects` 现返回 `{id,title,subtitle,description,coverImage,...,role,year,...}`，
**无** `publishedAt`；`searchData.ts:66` 读 `project.date || project.createdTime`；
`src/app/projects/page.tsx:71` 把 `project.role` 直接传给 `ProjectCard`。

**修订**——本地适配层（`src/data/localContent.ts`）必须对**每个**语言产出**已展平**的对象：

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` / `subtitle` / `description` / `role` | `string` | 由 `{en, zh}` 按请求语言展平（**不得**把对象直接透传） |
| `technologies` | `string[]` | 原样 |
| `date` | `string` (ISO) | **新增**：由种子的 `publishedAt` 合成，供 `searchData.ts:66` 与排序使用 |
| `createdTime` | `string` (ISO) | **新增**：同 `date`，兼容 `project.createdTime` 读取路径 |
| `id` / `slug` / `category` / `year` / `client` / `featured` / `coverImage` / `projectUrl` / `githubUrl` | 同既有形状 | |

blog 侧同理：`title`/`excerpt`/`tags`/`readTime`/`date`/`author`/`lastEditedTime` 均展平为标量。

### 8.8 C-5 admin 分析页文案

**问题确认（属实）**：v1 未说明新增 admin 页的文案方案，可能构成硬编码违规。

**修订**：admin 分析页文案**沿用既有 `src/lib/adminMessages.ts` 静态引入模式**
（该模式与 `commentMessages.ts` / `subscribeMessages.ts` 一致，是项目在未挂载
`NextIntlClientProvider` 前提下确立的既定做法），在 `adminMessages` 内新增 `searchAnalytics` 命名空间，
EN/ZH 成对。面向**访客**的搜索页文案继续沿用 `searchTexts`（见 §2 / C-5 判定）。

### 8.9 C-6 共享类型放置

**问题确认（属实）**：`工程结构.md`「类型放置」要求跨组件/跨层共享类型入 `src/types/`。

**修订**：
- 新增 `src/types/search.ts`：承载**跨层共享**的搜索契约类型
  （`SearchQueryParams`、`ParsedSearchQuery`、`SearchResponse`、`SearchSuggestion`、
  `SearchAnalyticsSummary`、`RelatedItem`）。
- `SearchDoc` / `SearchHit` 保留在 `src/lib/searchIndex.ts`（既有位置，避免大范围改动
  import 路径 —— 但它们被多模块共享，故在新文件中 **re-export**，`src/types/search.ts`
  作为对外的统一出口）。
- `src/data/projects.ts` 的 `ProjectType` 与 `src/data/blog.ts` 的 `BlogPostType` 沿用
  **既有**的「领域 fallback 类型就近定义」现状（`comments.ts` 亦如此），不在本次改动范围内
  迁移，避免需求外重构；在报告中记为遗留项。

### 8.10 A-1 过程交付物

**修订**：`tasks.md` 补入 T20（`summary.md` 每阶段更新 + 每能力块 A–G 交付小节）与
T21（评审报告版本递增、旧版不删）。本文档即为该规则的第一次执行：
`review/spec_review_v1.md` 保留，本 §8 为响应，`review/spec_review_v2.md` 为复评。

### 8.11 事实更正（v1 评审提出的条目）

| v1 评审陈述 | 核实结果 |
|---|---|
| 「现有 11 篇」blog 种子 | 原文实际为 **10** 篇；本变更已新增 3 篇 → 现共 **13** 篇。spec §4.2 措辞已在任务书中更正 |
| `BlogPostType` 需新增 `tags`/`readTime` | **评审期间作者已落盘**，非 spec 缺陷（时序观察） |
| `src/data/projects.ts` 待新建 | **评审期间作者已落盘**，非 spec 缺陷（时序观察） |
| MiniSearch 默认「按空白分词」 | 更正为「按空白**或标点**切分」，结论不变（中文无空白边界，问题依旧） |
| `/api/search` 的 `revalidate=600` 缓存结果 | 更正：已读 `request.url`，本就走动态 —— 见 §8.3 B-3 |
| `highlight` 单字 CJK 不高亮 | **接受**：`highlight` 过滤 `length < 2` 的词，单字中文查询不高亮。属 UI 细节，明确**不在本次验收范围**，记入遗留项 |
| D-03 移除 `RelatedPosts` 是行为变更 | **接受**：作为 HITL 决策 D-03 显式记录，风险与理由已写明 |

### 8.12 新增决策

| ID | 待决议项 | 候选方案 | 采纳结论 | 依据 |
|---|---|---|---|---|
| D-07 | 限流桶模型 | (a) 沿用单一全局桶；(b) 扩展为命名桶 | **(b)** | (a) 无法同时满足 S16（触发 429）与 S24（20 次连发）；且搜索与评论共用一个 10/min 预算会互相误伤 |
| D-08 | S18 的 id 口径与时效基准 | (a) 只比较「几乎相同」；(b) 统一 id 口径 + 小时取整时效基准 + 共用排序管线 | **(b)** | S18 要求「完全一致」，(a) 不可证明。共用管线本身也是能力块 F「统一检索层」的要求 |
| D-09 | 内存单例的跨模块共享 | (a) 模块级变量；(b) `globalThis` 钉住 | **(b)** | `next dev` 下不同 route 可能是不同模块实例，否则 S14/S15 直接失败 |
| D-10 | fallback 生效边界 | (a) 无条件优先本地数据；(b) 仅 Notion 未配置/失败时回落 | **(b)** | (a) 会让生产环境永远看不到 Notion 内容；fallback 的语义就是「兜底」 |
| D-11 | 搜索结果列表的数据源 | (a) 客户端 `useSearch` 过滤；(b) 服务端 SSR 按 URL 检索，`useSearch` 仅作输入预览 | **(b)** | 能力块 G 明令「SSR 首屏按 URL 直出」；两套过滤口径必然分叉，是 S18/S19 的主要风险源 |

### 8.13 D-04 更新

原 D-04（「同一 CJK 片段内 bigram 用 OR」）**作废**，由本次 B-1 修订取代：
**查询侧仅用 bigram + 全局 AND，不引入 OR 降级**。理由见 §2A 的 B-1 修订说明。
