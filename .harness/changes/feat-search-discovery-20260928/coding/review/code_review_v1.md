# 编码评审报告 v1（批次 1：检索核心与数据层）

- **变更**：feat-search-discovery-20260928
- **阶段**：阶段 4 编码评审（批次 1）
- **评审对象**：批次 1 交付物（T01–T06 + T09）
- **评审人**：独立 reviewer subagent（未接触作者会话上下文）
- **评审轮次**：第 1 轮
- **结论**：🔴 **REJECTED**（1 项 P1 + 9 项 P2）

> **流程偏差声明**：需求要求「批次 1 评审通过后再进入批次 2」。本次执行中，批次 2 的编码
> 与本轮评审**并行**进行。偏差已记入 `summary.md` 的流程偏差小节，批次 2 代码在
> `code_review_v2.md` 中独立评审——**未因并行而跳过任何评审**。

---

## 1. 受审文件

**新建**
- `src/lib/cjkTokenizer.ts`
- `src/lib/searchRanking.ts`
- `src/data/projects.ts`
- `src/data/localContent.ts`
- `src/lib/__tests__/fixtures/searchBenchmark.json`
- `src/lib/__tests__/searchBenchmark.test.ts`
- `src/lib/__tests__/baseline.original.test.ts`（一次性脚本）
- `src/lib/__tests__/scratch.smoke.test.ts`（一次性脚本）

**修改**
- `src/lib/searchIndex.ts`（重写分词接入、新增 `runSearchAll`、重写 `highlight`）
- `src/data/blog.ts`（新增 posts-10..12 + 可选 `tags`/`readTime`）
- `src/services/notion.ts`（4 个读取函数接入本地 fallback）

---

## 2. 阻塞项 P1

### P1-1 fallback 判据过宽，会遮蔽可用的 Notion 路径

**位置**：`src/services/notion.ts` 的 `getProjectById` 守卫、`getBlogPostById` 守卫

**问题**：两个「按 id 直取」的函数被加上了**含 DB id** 的守卫：

```ts
// getProjectById
if (!process.env.NOTION_API_KEY || !PROJECTS_DATABASE_ID) { return getLocalProjectById(...) }
// getBlogPostById
if (!process.env.NOTION_API_KEY || !BLOG_DATABASE_ID) { return getLocalBlogPostById(...) }
```

但这两个函数体**从不使用** DB id —— 它们直接 `notion.pages.retrieve({ page_id: id })`。
因此在「**有 Key 但未配 DB id**」的部署下：

| 函数 | 改造前 | 改造后（本轮） |
|---|---|---|
| `getProjectById(真实UUID)` | 正常返回项目 | 短路到本地 → `find` 未命中 → **返回 null → 详情页 404** |
| `getBlogPostById(真实pageId)` | 正常返回（父页面模式下 `BLOG_DATABASE_ID` 本就为空） | 短路到本地 → **返回 null**；`/api/content/[id]/preview` 同步回归 |

**这违反了 spec §8.6 规则 1**：「fallback 仅在 Notion 未配置或调用失败时生效，即**恰好是原本返回 `null`/`[]`** 的路径；不改变 Notion 正常可用时的任何行为」。

**佐证**：同一文件内 `getAllBlogPosts` 的守卫**只**判 `NOTION_API_KEY`，两个函数判据不一致，
说明是本轮引入的疏忽而非有意设计。

**修复（已执行）**：两个函数改为**只**以 `NOTION_API_KEY` 为判据；真正的调用失败由 `try/catch` 兜底
（catch 中已回落本地）。`getProjectBySlug` / `getAllProjects` / `getAllBlogPosts` 确实要查数据库，
保留 DB id 判据不变。

**复核**：`grep -n "PROJECTS_DATABASE_ID" src/services/notion.ts` 确认 `getProjectById` 函数体内无该变量引用。

---

## 3. 非阻塞项 P2

| # | 问题 | 处置 |
|---|---|---|
| P2-1 | **增补平面 CJK 被静默丢弃**：字符类只覆盖 BMP，`U+20000` 起（如「𠮷」「𡃁」）被当作词分隔符剔除 | ✅ **已修**：改用码点数值区间表，新增扩展 B~F 与兼容表意文字增补；`buf.slice` 改按码点截断 |
| P2-2 | `searchIndex.ts` 注释称「queryTokens 为空说明…直接空结果」，但 `runSearchAll` 从未调用 `queryTokens`（行为正确，注释描述的是不存在的代码） | ✅ **已修**：改为准确描述 |
| P2-3 | 单字 CJK 查询噪声（`的` 命中 5/5 文档） | ⏸ 设计如此（spec §2A 明示索引侧保留 unigram 以支持单字查询），无停用词表；记为已知取舍 |
| P2-4 | `scoreRelated` 的 Jaccard 可能 > 1（候选侧重复标签 `["A","a"]` → shared 2 / union 1） | ✅ **已修**：候选侧先归一化去重 |
| P2-5 | fixture 定义了 `expectTopOf` 但无测试读取 → 排序质量未测 | ⏳ 批次 2 补排序断言测试 |
| P2-6 | `searchIndex.ts` 注释引用的 `searchI18n.test.ts` 不存在 | ⏳ 批次 2 创建该测试文件 |
| P2-7 | 一次性脚本未删（`baseline.original.test.ts`、`scratch.smoke.test.ts`）；后者会写文件进 `.harness/`，干净检出下可能失败 | ⏳ 交付前删除（已列入交付清单） |
| P2-8 | `blog.ts` 注释「既有 11 篇」与实际（10 篇）不符 | ✅ **已修** |
| P2-9 | Rules 文档已过时：`项目编码规范.md` 写「Projects 例外，无 fallback」、`工程结构.md` 写「Projects 无 fallback」，与本变更直接冲突 | ✅ **已修**：两份 Rules 同步更新，并补入「fallback 不得遮蔽可用 Notion 路径」的硬性约束 |

---

## 4. 评审人确认**无问题**的部分（静态分析 + 隔离探针）

- **不可能出现混合 token**：`segmentText` 在每个 CJK 性变化处 flush，且 `NON_WORD` 字符类
  不可能包含 CJK，因此每个 token 必为「纯 CJK」或「纯拉丁数字」，`isCjkChar(term[0])`
  的分类判断成立。
- **排序是全序**：两个比较器均以 `id` 升序收尾（id 唯一）→ 确定性成立；
  `applyRecencyWeight` / `recencyFactor` 无 NaN/Infinity（`parseDateMs` 对非有限值归 0，
  未来日期夹到 1）。
- **签名变更是向后兼容的**：全部调用点（`projects/[slug]/page.tsx:41`、
  `zh/projects/[slug]/page.tsx:37`、`api/content/[id]/preview/route.ts:39`）传参 ≤1 个。
- **本地返回形状与消费方匹配**：`projects/page.tsx:71` 读 `project.role`/`technologies`/`client`/`year`；
  block 形状 `{type, [type]: {rich_text}}` 与 `renderNotionBlocks` 和 `NotionRenderer` 一致。
- **语言取值与过滤器一致**：`localContent` 产出 `'English'|'Chinese'`，正是
  `searchData.ts:73` 过滤所用的值，无跨语言泄漏。
- **规范**：无新依赖、页面无内联 Notion SDK、未删除 `src/data` 既有数据、无范围外重构。

## 5. 评审人执行的门禁（原始输出）

```
$ npx vitest run
 Test Files  14 passed (14)
      Tests  138 passed (138)

$ npx tsc --noEmit
(无输出 — 干净)

$ npx eslint src/lib/cjkTokenizer.ts src/lib/searchRanking.ts src/lib/searchIndex.ts \
    src/data/localContent.ts src/data/projects.ts src/services/notion.ts
(无输出 — 零 error / 零 warning)
```

## 6. 评审人明确声明**未能验证**的事项

- `npm run build`（不在本轮请求的门禁内，由阶段 8 执行）。
- 真实 Notion 配置下的行为——全部结论基于静态分析与隔离探针，未使用真实 Key。
- 交付环境中 `.harness/` 是否存在（决定一次性脚本是否会导致 `npm test` 失败）。
- 评审期间工作树发生变化（作者于 19:54 修改了博客详情页），门禁输出可能未覆盖最终工作树，
  须在合并前重跑。
