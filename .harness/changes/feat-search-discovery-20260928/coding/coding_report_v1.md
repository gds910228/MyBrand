# 编码报告（批次 1：检索核心与数据层）

- **变更**：feat-search-discovery-20260928
- **阶段**：阶段 3 编码实现（批次 1）
- **对应任务**：T01–T06 + T09
- **评审**：`coding/review/code_review_v1.md`（v1 REJECTED → 修复 → 见 v2）

---

## 1. 改动文件清单

> 仓库无 `.git`（需求方确认），按仓库既有做法以「改动文件清单」等价替代提交记录。

### 新建

| 文件 | 职责 |
|---|---|
| `src/lib/cjkTokenizer.ts` | CJK 感知分词：片段切分 + unigram/bigram 展开（能力块 A 核心） |
| `src/lib/searchRanking.ts` | 时效加权、确定性比较器、相关推荐评分（能力块 C/F 核心） |
| `src/data/projects.ts` | 项目本地种子（6 个，双语 + technologies） |
| `src/data/localContent.ts` | 本地种子 → Notion 服务形状的展平适配层 |
| `src/lib/__tests__/fixtures/searchBenchmark.json` | **查询质量基准集**（12 条：en4/zh4/mixed4） |
| `src/lib/__tests__/searchBenchmark.test.ts` | 基准集召回测试 |
| `src/lib/__tests__/cjkTokenizer.test.ts` | 分词器测试 |
| `src/lib/__tests__/searchRanking.test.ts` | 排序与推荐评分测试 |
| `src/lib/__tests__/localSeeds.test.ts` | 种子完整性 + 适配层形状测试 |

### 修改

| 文件 | 变更 |
|---|---|
| `src/lib/searchIndex.ts` | 接入 CJK 分词（索引侧 unigram∪bigram / 查询侧仅 bigram）；新增 `runSearchAll`/`normalizeQuery`；`highlight` 改为分隔符容忍的逐字符匹配；`searchTexts` 补齐 B/C/D/G 文案 |
| `src/data/blog.ts` | `BlogPostType` 新增可选 `tags`/`readTime`；**追加** 3 篇双语种子（post-10/11/12），既有 10 篇保留不动 |
| `src/services/notion.ts` | 5 个读取函数接入本地 fallback（`getAllProjects`/`getProjectById`/`getProjectBySlug`/`getAllBlogPosts`/`getBlogPostById`） |

---

## 2. 关键设计与决策

### 2.1 分词：为什么是「索引侧 unigram∪bigram + 查询侧仅 bigram」

| 侧 | 产出 | 理由 |
|---|---|---|
| 索引 | 「入门指南」→ `入 门 指 南` + `入门 门指 指南` | unigram 保证**单字查询**可召回；bigram 保证多字词**按序**命中 |
| 查询 | 「入门」→ `入门`；「性能优化」→ `性能 能优 优化` | 查询侧若也用 unigram，`入门` 会变成 `入 OR 门`，任何含「入」或「门」的文档都被召回，精度崩塌 |

MiniSearch 7.2.0 的类型定义已核实同时支持索引侧与查询侧的 `tokenize`/`processTerm`
（`node_modules/minisearch/dist/es/index.d.ts` L376/L402/L513/L546），且 `processTerm` 允许返回 `string[]`。

### 2.2 数据层 fallback 的边界（决策 D-10）

**只在「原本必然返回 `null`/`[]`」的路径生效**，不遮蔽可用的 Notion 路径。
批 1 评审 P1 指出：`getProjectById` / `getBlogPostById` 是按 **page_id** 直取、
**不使用** DB id，因此守卫只判 `NOTION_API_KEY`。已修复并复核。

### 2.3 增补平面 CJK（评审 P2-1）

初版字符类只覆盖 BMP，`U+20000` 起的中日韩扩展字（如港台人名用字「𠮷」「𡃁」）会被当作
分隔符丢弃。改为**码点数值区间表**（因 `tsconfig.target=es5` 不允许正则 `u` 标志），
并新增 `firstCodePoint()` 避免用 `s[0]` 取到半个代理对。

---

## 3. 门禁证据

| 门禁 | 结果 | 证据 |
|---|---|---|
| scoped ESLint | 零 error | `ci_result/eslint_scoped_raw.txt`（0 字节） |
| `npm run build` | 成功 | `ci_result/ci_result.md` |
| `npm test` | 全绿 | `ci_result/test_raw.txt` |
| 基准集召回 | **12/12** | `src/lib/__tests__/searchBenchmark.test.ts` |
| 改造前基线 | 7/12（隔离）/ 0/12（端到端） | `baseline_report.md` |

---

## 4. 遗留（带入批次 2 / 最终遗留清单）

- P2-5（fixture 的 `expectTopOf` 未被断言）：批次 2 补排序断言测试 → 已在 `searchService.test.ts` 中补强时效加权断言。
- P2-6（`searchI18n.test.ts` 尚未创建）：批次 2 创建 → 已完成。
- P2-7（一次性脚本未删）：交付前处理 → `scratch.smoke.test.ts` 已删；
  `baseline.original.test.ts` 已移出 `src/`（改名 `run_retrieval_baseline.test.ts` 存于变更目录，
  避免被 `npm test` 采集，同时保留可复现性）。
