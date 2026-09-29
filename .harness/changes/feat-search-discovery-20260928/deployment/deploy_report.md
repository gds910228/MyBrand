# 部署验证报告（阶段 9）

- **变更**：feat-search-discovery-20260928
- **阶段**：阶段 9 部署验证
- **验证环境**：本地 `next dev`（端口 **3100**），**空 Notion Key 降级路径**（`.env.local` 已按决策 D-01 脱敏）
- **验证集**：`src/data/blog.ts`（13 篇）+ `src/data/projects.ts`（6 个）本地种子，共 **19 篇文档/语言**
- **执行方式**：`node deployment/run_acceptance.mjs http://localhost:3100`
  （原始输出全文见 `deployment/acceptance_raw.txt`）+ S18 单独 e2e（`deployment/run_s18_e2e.test.ts`）
- **结论**：✅ **S1–S24 全部通过**

> **部署方式声明**：本项目**无自动化部署流水线**（无 Vercel 配置可用的凭据、无 CI）。
> 按 `.harness/agents/application-owner.md` 阶段 9「无部署流水线时本阶段手动」，
> 本次以**本地 dev server + curl/脚本端到端验证**替代线上部署验证。
> **未触发任何线上部署，未调用任何真实外部服务。**
> 因空 Key 无内容变更（种子数据为代码），**未调用 `/api/revalidate`**（无 ISR 内容需失效）。

---

## 一、验收矩阵（S1–S24 逐条）

### 检索质量

#### S1 英文检索 ✅
```bash
curl -s "http://localhost:3100/api/search?q=nextjs&locale=en"
```
| 项 | 值 |
|---|---|
| HTTP | **200** |
| results | **4** 条 |
| 每项含 title/type/score | **true** |
| 命中 id | `blog:post-10, blog:post-1, project:proj-1, blog:post-test-image-video` |

**结论**：通过。英文检索正常，响应项字段齐全。

#### S2 中文检索（`入门`）✅
```bash
curl -s "http://localhost:3100/api/search?q=%E5%85%A5%E9%97%A8&locale=zh"
```
HTTP=**200**，ids=`[blog:post-1]` → 命中《Next.js 14 入门指南》**true**

**结论**：通过。

> 注：`locale=zh` 为**必需参数**——`getSearchDocuments` 按 `language` 过滤索引文档
> （`src/services/searchData.ts:71-73`），不传 `locale` 默认检索英文索引（见 spec §8.2）。

#### S3 中英混合（`Next.js 入门`）✅
```bash
curl -s "http://localhost:3100/api/search?q=Next.js%20%E5%85%A5%E9%97%A8&locale=zh"
```
HTTP=**200**，ids=`[blog:post-1]` → 命中该文 **true**

**结论**：通过。英文词与中文词须命中**同一文档**（AND 语义）。

#### S4 非词头中文子串 ✅
```bash
curl -s "http://localhost:3100/api/search?q=%E6%8C%87%E5%8D%97&locale=zh"     # 指南
curl -s "http://localhost:3100/api/search?q=%E6%B8%B2%E6%9F%93&locale=zh"     # 渲染
curl -s "http://localhost:3100/api/search?q=%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96&locale=zh"  # 性能优化
```
| 查询 | 命中 id |
|---|---|
| `指南` | `blog:post-11, blog:post-1, blog:post-7` |
| `渲染` | `blog:post-10, project:proj-2, blog:post-12` |
| `性能优化` | `blog:post-12` |

**结论**：通过。三个中文子串均为**非词头**（分别位于标题末尾/中段），
证明分词改造生效而非仅前缀匹配 —— 详见下方 before/after 对照。

### 查询与过滤

#### S5 类型过滤 ✅
```
type=blog    → HTTP=200 n=12 全为 blog=true
type=project → HTTP=200 n=6  全为 project=true
type=video   → HTTP=400 error="Invalid type: expected one of blog, project"
```
**结论**：通过（非法 type 返回 400，符合「400 或空结果」要求）。

#### S6 标签过滤 ✅
```
q=的&tag=nextjs&locale=zh → HTTP=200 n=1 全部含标签 nextjs=true
样例: [{"id":"blog:post-10","kw":["nextjs","ssr","performance"]}]
```
**结论**：通过。结果 keywords 均含该标签（大小写不敏感精确匹配）。

#### S7 时间范围 ✅
```
q=a&from=2024-01-01&to=2024-12-31 → HTTP=200 n=10 全部在范围内=true
日期样例=[2024-04-11, 2024-06-15, 2024-01-22, 2024-06-10]
```
**结论**：通过（含边界）。

#### S8 组合过滤 ✅
```
q=a&type=project&tag=docker&from=2023-01-01&to=2025-12-31
→ HTTP=200 n=2 同时满足全部条件=true ids=[project:proj-4, project:proj-3]
```
**结论**：通过。类型 + 标签 + 时间范围三条件同时生效。

### 排序与分页

#### S9 排序 ✅
```
sort=newest → 日期降序=true  [2024-07-21, 2024-07-08, 2024-06-15, 2024-06-10, 2024-06-05]
默认(relevance) → 分数降序=true，响应 sort 字段="relevance"
```
**结论**：通过。

#### S10 确定性 ✅
```
EN: [blog:post-10, blog:post-1, project:proj-1, blog:post-test-image-video]
 === [blog:post-10, blog:post-1, project:proj-1, blog:post-test-image-video] → true
ZH: 两次一致=true
```
**结论**：通过。同分以 `id` 升序兜底（`src/lib/searchRanking.ts` 的 `compareByRelevance` 终局比较）。

#### S11 分页 ✅
```
page=2&pageSize=5 → total=18 totalPages=4 page=2 pageSize=5 count(本页)=5 切片正确=true
page=9999        → HTTP=200 results=0（空集，不报错）
```
**结论**：通过。

### 健壮性

#### S12 容错与安全 ✅
```
HTTP: xss=200 long=200 blank=200 weird=200（均非 500=true）
响应不含未转义 <script>/onerror=true
blank results=0; weird results=0
```
**结论**：通过。4 类畸形输入均不 500；响应报文经 `safeJson` 无损转义，
不含字面量可执行片段。

### 建议与分析

#### S13 搜索建议 ✅
```
EN prefix=nex → source=index suggestions=[{"text":"nextjs","count":2},{"text":"Next.js","count":1}]
ZH prefix=渲  → source=index suggestions=[{"text":"中的服务端渲染与静态生成","count":1},
                                          {"text":"渲染","count":1},{"text":"端渲","count":1}]
空前缀       → source=fallback（静态热门词兜底）
```
**结论**：通过。建议词**来自当前索引内容**（标题 + 标签），替代写死数组；
静态热门词仅作兜底。

#### S14 热门词聚合 ✅
```
执行 nextjs / typescript / tailwind / docker 各 2 次后：
totalSearches=35 uniqueQueries=15
各词增量=[{nextjs:+2},{typescript:+2},{tailwind:+2},{docker:+2}]（期望均为 +2）
topQueries 含上述全部词
```
**结论**：通过。采用**增量断言**（分析存储为进程内单例，事件跨多次验收运行累积，
绝对值断言会误报）。

#### S15 零结果词 ✅
```
构造 3 次无命中查询 zzz-nonexistent-query-xyz
→ 该词在 zeroResultQueries 中可见，增量 +3（期望 +3）
zeroResultQueries=[{zzz-nonexistent-query-xyz:3},{<script>alert(1)</script>:1},{aaa…:1},{、。？！😀:1}]
```
**结论**：通过。注意响应中 `<script>` 已转义为 `<script>`（safeJson 生效）。

#### S16 限流 ✅
```
独立 IP 10.0.0.16 连续请求：
首次 429 出现在第 61 次（search 桶上限 60/60s）
后续状态码=[200,200,200,200,200,429,429,429,429,429]
```
**结论**：通过。`/api/search` 已接入限流（改造前**未接入**）。

#### S17 分析端点鉴权 ✅
```
无 token: /api/admin/search-analytics=401  /api/admin/comments=401  （一致=true）
带 Bearer token: HTTP=200 ok=true
```
**结论**：通过。行为与既有 `/api/admin/*` **完全一致**（复用 `checkAdminAccess`）。
`.env.local` 配置了本地占位 `ADMIN_TOKEN`，故无 token 一律 401。

### 一致性与 URL 状态

#### S18 两端口径一致 ✅（单独 e2e 脚本验证）
本项不在 `run_acceptance.mjs` 中（需在两端口径下重建客户端索引），
由 `deployment/run_s18_e2e.test.ts` 单独验证：

| 查询 | locale | 命中数 | 服务端 id 序列 === 客户端 id 序列 |
|---|---|---|---|
| `nextjs` | en | 4 | ✅ |
| `docker` | en | 2 | ✅ |
| `入门` | zh | 1 | ✅ |
| `渲染` | zh | 3 | ✅ |
| `Next.js 入门` | zh | 1 | ✅ |
| `性能优化` | zh | 1 | ✅ |
| 索引下发文档数 | en | 19 | ✅ `count === documents.length` |

```
Test Files  1 passed (1)
     Tests  7 passed (7)
```
**方法**：服务端侧请求 `/api/search`（完整服务层）；客户端侧请求 `/api/search/index`
取回文档 → `createSearchIndex` → `rankDocs`（`useSearch` 内部所用的**同一组函数**）→ 取 id 序列。
两侧共用 `searchPipeline.rankDocs` 与按小时取整的 `rankingReferenceTime()`。

**结论**：通过。7/7 完全一致。

#### S19 URL 即状态 ✅
```
/search?q=a&type=blog    → HTTP=200 含结果容器=true SSR 内嵌 id=12 全为 blog=true
/search?q=a&type=project → HTTP=200 SSR 内嵌 id=6  全为 project=true
```
**结论**：通过。SSR HTML **直出过滤后结果**（`data-result-id` 出现在首屏 HTML 中），
URL 可直接分享访问。

### 双语与推荐

#### S20 双语页面 ✅
```
EN /search?q=nextjs        → HTTP=200 含 "Search Content"=true 含结果容器=true
ZH /zh/search?q=入门        → HTTP=200 含 "搜索内容"=true    含结果容器=true
```
**结论**：通过。EN/ZH 文案完全对齐（另有 `searchI18n.test.ts` 断言 key 零漂移）。

#### S21 相关内容模块 ✅
```
blog EN     : HTTP=200 区块=true 条目=4 ids=[blog:post-5, blog:post-7, blog:post-2, blog:post-test-image-video]
blog ZH     : HTTP=200 区块=true 条目=4 ids=[blog:post-5, blog:post-7, blog:post-2, blog:post-test-image-video]
project EN  : HTTP=200 区块=true 条目=4 ids=[project:proj-5, project:proj-2, project:proj-6, project:proj-4]
project ZH  : HTTP=200 区块=true 条目=4 ids=[project:proj-5, project:proj-2, project:proj-6, project:proj-4]
```
**结论**：通过。**四处成对挂载**，SSR HTML 含相关内容区块且条目非空。

#### S22 推荐相关性 ✅
```
blog EN    推荐=[blog:post-5, blog:post-7, blog:post-2, blog:post-test-image-video]（同类型，均 blog）
project EN 推荐=[project:proj-5, project:proj-2, project:proj-6, project:proj-4]（同类型，均 project）
EN 推荐理由文案出现=true; ZH 推荐理由文案出现=true
```
**结论**：通过。推荐**同类型优先**且带**推荐理由字段**（`reason`，如
`Shares nextjs, react` / `共同标签：nextjs`）。

### 回归与性能

#### S23 回归组 ✅
```
?language=Chinese → HTTP=200 ids=[blog:post-1]                    （旧参数兼容，未回归）
?language=English → HTTP=200 ids=[blog:post-10, blog:post-1, project:proj-1]
/api/comments       → HTTP=200 含 comments 数组=true 条数=2        （未回归）
/api/projects       → HTTP=200 条数=6                              （未回归，且由 0 → 6，见「行为变更」）
/api/admin/comments → HTTP=401                                     （鉴权语义未变）
```
**结论**：通过。

#### S24 性能与缓存 ✅
```
成功请求数=20/20（无 429）
min=651.4ms  avg=727.5ms  p95=847.2ms  max=847.2ms
```
**索引构建缓存策略**：
- `src/lib/searchIndexCache.ts`：按 `locale` 分桶的**进程内**索引缓存，TTL **5 分钟**；
- 单例**钉在 `globalThis`**（`__misotech_search_index_cache__`），保证同一 Node 进程内
  跨 route 模块实例共享（评审 P1-5 / 决策 D-09）；
- "连续请求不重复构建"的**直接证据**在单元测试
  `searchService.test.ts` → 「连续请求只构建一次索引」：首次 `cached=false` 且构建计数=1，
  后续调用 `cached=true` 且计数**仍为 1**。

> **诚实标注**：上述耗时来自 **`next dev`（开发模式，按需编译 + 未压缩）**，
> **不代表生产性能**。本次未做生产 `next start` 压测（沙箱内构建耗时约 30 分钟，
> 且 dev 模式已足以证明「缓存生效」这一验收点）。生产性能需在真实部署后复测，
> 已列入遗留问题清单。

> **归因更正**：S24 的「索引构建有缓存」应归因于 **`searchIndexCache`**，
> **不是** ISR —— `/api/search` 已显式 `dynamic = 'force-dynamic'`，
> 其 `revalidate` 配置本就不生效（spec §8.3 B-3 已更正）。

---

## 二、基线 before/after 对照表（强制）

基准集：`src/lib/__tests__/fixtures/searchBenchmark.json`（12 条：en 4 / zh 4 / mixed 4）。

### 2.1 端到端（dev server + 空 Key，真实 HTTP）

| 查询 | 类别 | 改造前 | 改造后 | 变化 |
|---|---|---|---|---|
| en-1 `nextjs` | en | ✗（0 命中） | ✅ `[blog:post-10, blog:post-1, project:proj-1, blog:post-test-image-video]` | ↑ |
| en-2 `tailwind css` | en | ✗ | ✅ 命中 `blog:post-2` | ↑ |
| en-3 `typescript generics` | en | ✗ | ✅ 命中 `blog:post-11` | ↑ |
| en-4 `docker` | en | ✗ | ✅ 命中 `project:proj-3/4` | ↑ |
| zh-1 `入门` | zh | ✗ | ✅ 命中 `blog:post-1` | ↑ |
| zh-2 `指南` | zh | ✗ | ✅ 命中 `blog:post-1/11` | ↑ |
| zh-3 `渲染` | zh | ✗ | ✅ 命中 `blog:post-10` | ↑ |
| zh-4 `性能优化` | zh | ✗ | ✅ 命中 `blog:post-12` | ↑ |
| mix-1 `Next.js 入门` | mixed | ✗ | ✅ 命中 `blog:post-1` | ↑ |
| mix-2 `React 性能优化` | mixed | ✗ | ✅ 命中 `blog:post-12` | ↑ |
| mix-3 `TypeScript 泛型` | mixed | ✗ | ✅ 命中 `blog:post-11` | ↑ |
| mix-4 `Tailwind 响应式` | mixed | ✗ | ✅ 命中 `blog:post-2` | ↑ |
| **合计** | | **0 / 12** | **12 / 12** | **+12** |

> 改造前端到端全为 0 的原因：blog/project **均无本地 fallback**，空 Key 下索引文档数为 0
> （详见 `baseline_report.md` §1.4）。

### 2.2 检索层隔离（**固定同一语料，只换检索实现** —— 证明能力块 A）

此对照的关键性：端到端 0→12 混合了「补数据层」与「改分词」两个成因；
本表固定改造后的种子语料，**只把检索实现换回改造前版本**，从而把分词改造的贡献单独隔离出来。

| 查询 | 类别 | 改造前实现 | 改造后实现 | 变化 |
|---|---|---|---|---|
| en-1 `nextjs` | en | ✅ | ✅ | 持平 |
| en-2 `tailwind css` | en | ✅ | ✅ | 持平 |
| en-3 `typescript generics` | en | ✅ | ✅ | 持平 |
| en-4 `docker` | en | ✅ | ✅ | 持平 |
| zh-1 `入门` | zh | ⚠️ 仅靠**词头前缀**命中 | ✅ | 语义改善 |
| zh-2 `指南` | zh | ❌ **0 命中** | ✅ | **+1** |
| zh-3 `渲染` | zh | ❌ **0 命中** | ✅ | **+1** |
| zh-4 `性能优化` | zh | ❌ **0 命中** | ✅ | **+1** |
| mix-1 `Next.js 入门` | mixed | ⚠️ 仅靠**词头前缀**命中 | ✅ | 语义改善 |
| mix-2 `React 性能优化` | mixed | ❌ **0 命中** | ✅ | **+1** |
| mix-3 `TypeScript 泛型` | mixed | ⚠️ 仅靠**词头前缀**命中 | ✅ | 语义改善 |
| mix-4 `Tailwind 响应式` | mixed | ❌ **0 命中** | ✅ | **+1** |
| **合计** | | **7 / 12** | **12 / 12** | **+5** |

分类汇总：

| 类别 | 改造前 | 改造后 | 变化 | 硬性要求 | 判定 |
|---|---|---|---|---|---|
| 英文 en | **4 / 4** | **4 / 4** | 持平 | **不得回归** | ✅ **无回归** |
| 中文 zh | **1 / 4**（25%） | **4 / 4**（100%） | **+3** | 须有可见改善 | ✅ 显著改善 |
| 中英混合 mixed | **2 / 4**（50%） | **4 / 4**（100%） | **+2** | 须有可见改善 | ✅ 显著改善 |
| **合计** | **7 / 12** | **12 / 12** | **+5** | — | ✅ |

**基线对照结论**：
1. 中文查询召回率 **25% → 100%**；中英混合 **50% → 100%**，改善显著且可见。
2. 英文查询 **无回归**（4/4 保持），改造前命中的英文查询改造后仍全部命中。
3. 改造前后的差异**只出现在中文/混合查询**上，而这两类正是分词改造的直接作用面 ——
   证明改善确实来自能力块 A，而非其它因素。
4. 端到端维度另有独立增益 **0/12 → 12/12**，来自数据层 fallback 补齐。

### 2.3 「⚠️ 仅靠词头前缀命中」的含义

改造前 `入门` / `泛型` 之所以能命中，**不是分词正确**，而是 `prefix: true` 恰好使
查询词成为默认分词器产出的长 token（`入门指南`、`泛型实用指南`）的**前缀**。
证据：同样位于标题内的 `指南`（在 token 尾部）→ **0 命中**，`渲染` → **0 命中**。
这正是需求方痛点 1 的精确复现，也是本次改造的核心靶点。

---

## 三、行为变更声明（需产品方知悉）

| # | 变更 | 影响 | 依据 |
|---|---|---|---|
| B-1 | **项目数据由空变为 6 条**（补齐本地 fallback） | 空 Key 下 `/api/projects` 由 `[]` 变为 6 条；`/projects`、`/projects/[slug]`、sitemap 由 404/空变为有内容 | 需求明确要求补齐 projects fallback（spec §1.2 V-1、§4） |
| B-2 | **博客详情页由 404 变为可渲染** | 空 Key 下 `/blog/[slug]`、`/zh/blog/[slug]` 由 notFound 变为正常渲染 | 同上（blog fallback 补齐） |
| B-3 | **`/api/search` 响应新增字段** | 新增 `total`/`page`/`pageSize`/`totalPages`/`sort`/`filters`/`tookMs`；`id` 语义由 `refId` 改为全局口径 `<type>:<refId>`，**同时保留 `refId` 字段**兼容旧口径；`results`/`count`/`query` 三个旧字段语义不变 | 需求能力块 B；仓内**无任何** fetch `/api/search` 的消费者（已核实），故为纯增量 |
| B-4 | **`/api/search` 开始限流** | 单 IP 超过 60 次/分钟返回 429 | 需求痛点 6 |
| B-5 | **博客详情页「相关内容」区块换实现** | 由 `RelatedPosts` 换为 `SmartRecommendations`（决策 D-03），同页不再出现两个语义重复区块 | 需求能力块 F；`RelatedPosts.tsx` **文件保留不删** |
| B-6 | **`/api/content/[id]/preview` 在空 Key 下对种子 id 由 404 变为可预览** | 本地开发便利性改善；**非种子 id 仍为 404**；有 Notion Key 时行为完全不变 | 决策 D-10（fallback 只在原本返回 null 的路径生效） |
| B-7 | **`/search` 页由 `revalidate=600` 改为 `force-dynamic`** | 搜索结果不再走 ISR 静态化（本就因读 `request.url` 而近乎失效），URL 参数即时生效 | 能力块 G；spec §8.3 B-3 |

---

## 四、CI 等价门禁（阶段 8，真实输出）

详见 `ci_result/ci_result.md`。摘要：

| 门禁 | 结果 |
|---|---|
| scoped ESLint（新增/修改 44 文件） | ✅ 零 error、零 warning（输出 0 字节，exit 0） |
| 全量 `npm run lint` | ✅ 13 个报错文件**全部为未触碰的既有文件**，本次**未新增** error |
| `npm run build` | ✅ `Compiled successfully`，`BUILD_EXIT=0` |
| `npm test` | ✅ 22 文件 / **313 用例全绿**（既有 122 用例无回归） |
| `npx tsc --noEmit` | ✅ 无输出（类型干净） |

---

## 五、附录：验收原始输出

完整逐条原始输出（含每条的命令、HTTP 状态、响应要点）保存在：

- `deployment/acceptance_raw.txt` —— S1–S17、S19–S24 全量原始记录
- `deployment/after_benchmark.txt` —— 改造后基准集 12 条逐条结果（`SUMMARY: 12/12`）
- `baseline/baseline_retrieval_isolated.txt` —— 改造前检索层隔离基线（`7/12`）
- `baseline/original/` —— 改造前源码快照 + SHA256
- `deployment/run_acceptance.mjs` / `run_s18_e2e.test.ts` —— 可复现脚本
