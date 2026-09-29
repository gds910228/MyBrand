# 改造前召回基线报告

- **变更**：feat-search-discovery-20260928
- **阶段**：编码前采集（阶段 3 前置）
- **采集时间**：2026-09-28
- **基准集**：`src/lib/__tests__/fixtures/searchBenchmark.json`（12 条：en 4 / zh 4 / mixed 4）
- **采集方式**：空 Key 降级路径（`.env.local` 已按决策 D-01 脱敏，`NOTION_API_KEY` 为空）
- **严禁事项遵守**：全程未配置/未访问任何真实外部服务

---

## 0. 为什么需要两套基线（决策 D-05）

按需求方要求，基线应为「用当前（未修改的）代码空 Key 起 dev，对 12 条查询逐条记录命中」。
实际执行时发现**必须补一套隔离基线**，否则基线无法支撑「证明改善」这一目的：

| 基线 | 固定什么 | 变化什么 | 回答的问题 |
|---|---|---|---|
| **基线 A：端到端** | 代码版本（改造前） | —— | 改造前站点整体能召回多少 |
| **基线 B：检索层隔离** | **语料**（改造后的本地种子） | **仅检索实现**（改造前 vs 改造后） | 分词/检索改造本身带来多少改善 |

**原因**：核验发现改造前 blog 域**根本没有本地 fallback**（详见 §1），空 Key 下索引文档数为 0，
基线 A 必然是 0/12。若只有基线 A，「0/12 → 12/12」这一对比**无法区分**两个成因：
① 数据层缺 fallback；② CJK 分词不支持非词头子串。基线 B 通过固定语料、只替换检索实现，
把成因 ② 单独隔离出来，才能真实证明能力块 A 的价值。

---

## 1. 基线 A：端到端（改造前代码 + 空 Key）

### 1.1 环境与命令

```bash
# 改造前代码（未做任何修改），.env.local 中 NOTION_API_KEY 为空
npx next dev -p 3100
```

### 1.2 探针结果（原始输出）

```
$ curl -s "http://localhost:3100/api/search/index?locale=en"
{"locale":"en","count":0,"documents":[]}

$ curl -s "http://localhost:3100/api/search?q=nextjs"
{"results":[],"count":0,"query":"nextjs"}

$ curl -s "http://localhost:3100/api/projects"
[]
```

### 1.3 12 条基准查询逐条结果

采集脚本：`.harness/changes/feat-search-discovery-20260928/baseline/run_benchmark.sh`
（可复现：`bash run_benchmark.sh http://localhost:3100 <out>`）

```
[FAIL] en-1 (en) q="nextjs" locale=en              HTTP=200  hits=0  ids=[]
[FAIL] en-2 (en) q="tailwind css" locale=en        HTTP=200  hits=0  ids=[]
[FAIL] en-3 (en) q="typescript generics" locale=en HTTP=200  hits=0  ids=[]
[FAIL] en-4 (en) q="docker" locale=en              HTTP=200  hits=0  ids=[]
[FAIL] zh-1 (zh) q="入门" locale=zh                 HTTP=200  hits=0  ids=[]
[FAIL] zh-2 (zh) q="指南" locale=zh                 HTTP=200  hits=0  ids=[]
[FAIL] zh-3 (zh) q="渲染" locale=zh                 HTTP=200  hits=0  ids=[]
[FAIL] zh-4 (zh) q="性能优化" locale=zh              HTTP=200  hits=0  ids=[]
[FAIL] mix-1 (mixed) q="Next.js 入门" locale=zh      HTTP=200  hits=0  ids=[]
[FAIL] mix-2 (mixed) q="React 性能优化" locale=zh    HTTP=200  hits=0  ids=[]
[FAIL] mix-3 (mixed) q="TypeScript 泛型" locale=zh   HTTP=200  hits=0  ids=[]
[FAIL] mix-4 (mixed) q="Tailwind 响应式" locale=zh   HTTP=200  hits=0  ids=[]

===== SUMMARY: 0/12 queries satisfied =====
categories: {"en":4,"zh":4,"mixed":4}
```

### 1.4 关键发现：`src/data` 本地 fallback 并不存在

需求方背景描述称「空 Key 时降级到 `src/data` 本地 fallback（`src/data/blog.ts` 内置 en/zh 双语种子文章）」。
**实测不成立**：

| 事实 | 证据 |
|---|---|
| `src/data/blog.ts` 确实存在且含 10 篇双语种子 | `src/data/blog.ts` |
| 但**全仓库无任何代码 import 它** | `grep -rn "@/data/blog" src/` → 0 命中（改造前） |
| `src/data/` 下**没有** `projects.ts` | `ls src/data/` → blog / comments / experience / services / skills |
| `notion.ts` 仅从 `@/data/comments` 引入本地兜底 | `src/services/notion.ts:4-9` |
| `getAllBlogPosts` 空 Key 下 Notion 查询抛错 → `catch` 返回 `[]` | `notion.ts:878-881`（改造前行号） |
| `getAllProjects` 同理返回 `[]` | `notion.ts:285-288`（改造前行号） |

**结论**：`src/data/blog.ts` 改造前是**零引用的死数据**；空 Key 下端到端可用文档数为 **0**，
列表页与详情页均 404。这直接导致 S1–S24 全数无法达成，故本变更必须补齐数据层 fallback
（见 spec §4），否则任何检索改造都无法被端到端验证。

---

## 2. 基线 B：检索层隔离（固定语料，仅替换检索实现）

### 2.1 方法

- **语料固定**：使用改造后的本地种子，经真实适配层 `getSearchDocuments()` 构建
  （en 19 docs / zh 19 docs = 13 篇博客 + 6 个项目）。
- **检索实现替换为改造前版本**：`baseline/original/searchIndex.original.ts`
  （改造前 `src/lib/searchIndex.ts` 的逐字节快照，SHA256 见 `baseline/original/SHA256SUMS.txt`）。
- 采集脚本：`src/lib/__tests__/baseline.original.test.ts`（一次性脚本，交付前删除）
- 原始输出：`baseline/baseline_retrieval_isolated.txt`

### 2.2 逐条结果（改造前检索实现）

| 查询 | 类别 | 命中 id | 期望 | 结论 |
|---|---|---|---|---|
| en-1 `nextjs` | en | `blog:post-10` | post-1 或 post-10 | ✅ PASS |
| en-2 `tailwind css` | en | `blog:post-2, project:proj-6, project:proj-1` | post-2 | ✅ PASS |
| en-3 `typescript generics` | en | `blog:post-11` | post-11 | ✅ PASS |
| en-4 `docker` | en | `project:proj-4, project:proj-3` | proj-3/4 | ✅ PASS |
| zh-1 `入门` | zh | `blog:post-1` | post-1 | ✅ PASS ⚠️ |
| zh-2 `指南` | zh | **（空）** | post-1/post-11 | ❌ **FAIL** |
| zh-3 `渲染` | zh | **（空）** | post-10 | ❌ **FAIL** |
| zh-4 `性能优化` | zh | **（空）** | post-12 | ❌ **FAIL** |
| mix-1 `Next.js 入门` | mixed | `blog:post-1` | post-1 | ✅ PASS ⚠️ |
| mix-2 `React 性能优化` | mixed | **（空）** | post-12 | ❌ **FAIL** |
| mix-3 `TypeScript 泛型` | mixed | `blog:post-11` | post-11 | ✅ PASS ⚠️ |
| mix-4 `Tailwind 响应式` | mixed | **（空）** | post-2 | ❌ **FAIL** |

```
===== BASELINE SUMMARY: 7/12 =====
by category: {"en":{"pass":4,"total":4},"zh":{"pass":1,"total":4},"mixed":{"pass":2,"total":4}}
```

### 2.3 对「✅ PASS ⚠️」三条的说明——它们恰恰印证了痛点

zh-1 / mix-1 / mix-3 之所以在改造前能命中，**不是因为分词正确，而是因为 `prefix: true` 的词头前缀匹配**：

- `入门` 命中《Next.js 14 入门指南》：该标题被默认分词器切成 token `入门指南`，
  查询 `入门` 恰好是它的**前缀** → 前缀匹配命中。
- `指南` 同样是该标题的子串，但**不是词头**（token 是 `入门指南`，`指南` 在尾部）→ **0 命中**。
- `渲染` 在其文档中位于中段 → **0 命中**。
- `泛型` 命中《TypeScript 泛型实用指南》：token 为 `泛型实用指南`，查询是其前缀 → 命中；
  而 `性能优化` 不是任何 token 的前缀 → **0 命中**。

**这正是需求方痛点 1 的精确复现**：「中文短语会成为单个长 token，只能从词头前缀命中」。
改造后必须让**非词头子串**（`指南` / `渲染` / `性能优化`）也能稳定召回。

### 2.4 改造前基线汇总

| 类别 | 改造前（检索层隔离） | 改造前（端到端） |
|---|---|---|
| 英文 en | **4 / 4** | 0 / 4 |
| 中文 zh | **1 / 4** | 0 / 4 |
| 中英混合 mixed | **2 / 4** | 0 / 4 |
| **合计** | **7 / 12** | **0 / 12** |

---

## 3. 改造后复测结果（同一基准集）

采集方式：`npx vitest run src/lib/__tests__/searchBenchmark.test.ts`
（真实适配层 + 真实种子 + 改造后检索实现）

```
✓ fixture 结构满足要求：12 条，en/zh/mixed 各 4 条
✓ 全部 12 条查询均满足召回下界且无误召回（改造后）
✓ 四类查询（英文/中文/中英混合/中文非词头子串）均有确定命中
✓ 单字中文查询可用（索引侧保留 unigram）

Test Files  1 passed (1)
     Tests  4 passed (4)
```

**改造后：12 / 12。**

---

## 4. before / after 对照结论

| 类别 | 改造前（隔离） | 改造后 | 变化 | 要求 | 判定 |
|---|---|---|---|---|---|
| 英文 en | 4 / 4 | 4 / 4 | 持平 | **不得回归** | ✅ 无回归 |
| 中文 zh | 1 / 4 | **4 / 4** | **+3** | 须有可见改善 | ✅ 显著改善 |
| 中英混合 mixed | 2 / 4 | **4 / 4** | **+2** | 须有可见改善 | ✅ 显著改善 |
| **合计** | **7 / 12** | **12 / 12** | **+5** | — | ✅ |

**结论**：
1. 中文查询召回率由 **25%** 提升至 **100%**；中英混合由 **50%** 提升至 **100%**。
2. 英文查询召回**无回归**（4/4 保持），且改造前命中的英文查询改造后仍全部命中。
3. 改造前后的差异**只在中文/混合查询**上体现，而这两类正是分词改造的直接作用面——
   证明改善来自能力块 A，而非其它因素。
4. 端到端维度另有一条独立增益：**0/12 → 12/12**，来自数据层 fallback 补齐（spec §4）。

> 部署阶段的复测与逐条对照见 `deployment/deploy_report.md` 的 S1–S4 与「基线对照表」。
