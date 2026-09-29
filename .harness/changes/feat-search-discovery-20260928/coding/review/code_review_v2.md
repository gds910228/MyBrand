# 编码评审报告 v2（批次 2：API 整合 / 前端 / 推荐 / 分析视图）

- **变更**：feat-search-discovery-20260928
- **阶段**：阶段 4 编码评审（批次 2）
- **评审对象**：批次 2 交付物（T07、T08、T10–T17）
- **评审人**：独立 reviewer subagent（未接触作者会话上下文）
- **评审轮次**：第 2 轮（v1 审批次 1，见 `code_review_v1.md`，保留不删）
- **结论**：✅ **APPROVED**（无 P0/P1；11 项 P2，其中 9 项已修，2 项记入遗留清单）

---

## 1. 评审人明确「已排除」的风险（逐项核实）

评审人对以下高风险面做了**直接探针验证**，而非仅静态阅读：

| 面 | 结论 | 依据 |
|---|---|---|
| **safeJson 无损且有效** | ✅ 通过 | 用 `<script>`（值内与 **key 内**）、字面量 `<` 文本、反斜杠+`<`、U+2028/2029、astral 字符、`</script><img onerror>` 逐项探测。`JSON.stringify` 先转义反斜杠，故用户输入的 6 字符 `<` 原样往返（无 `<` 可替换）；替换后的报文不含字面量 `<script`/`<img` |
| **`highlight` 不可被诱导输出攻击者 HTML** | ✅ 通过 | 文本**先** `escape()`，再对转义后文本套用查询词正则；查询词本身经正则转义且仅以 `$1` 注入 |
| **限流默认桶向后兼容** | ✅ 通过 | `rateLimited(ip)` → key `default:ip`，max 10 / 60000ms；既有 4 个调用点仍只传 `ip`，行为一致；`resetRateLimitForTest()` 无参仍清空全部（`comments-route.test.ts:51` 依赖） |
| **参数解析无 500 路径** | ✅ 通过 | `Number('1e999')=Infinity` → 回落默认；`-0`/负数/非整数/全角数字 → 默认；数组值取首个；`from>to` → 空集；正则元字符标签走字面量比较；超大 page 提前返回 |
| **推荐确为服务端** | ✅ 通过 | `SmartRecommendations` 为 async 且无真实 `'use client'`；无客户端整库拉取；locale 驱动；自身按 id 排除；四个详情页（EN/ZH blog + project）均已挂载 |
| **分析无 PII** | ✅ 通过 | 事件字段仅 query/locale/resultCount/timestamp/type/tag/sort；1000 条环形缓冲；globalThis 钉住；埋点失败不影响响应 |
| **规范** | ✅ 通过 | 无新依赖、无 `src/components` 子目录、页面无内联 Notion SDK；en/zh JSON key 数各 241 且零漂移 |

---

## 2. P0 / P1

**无。** 评审人明确列出上述各项均已排除，未发现阻塞项。

---

## 3. P2（非阻塞）与处置

| # | 问题（评审人原文要点） | 作者处置 |
|---|---|---|
| P2-1 | 打字可能被服务端回包覆盖：`SearchPageClient.tsx` 的同步 effect 在用户继续输入时用旧的 `params.q` 覆盖本地输入 | ✅ **已修**：仅在 `query === lastPushed.current`（无待提交编辑）时同步 |
| P2-2 | `buildUrl` 丢弃未知 query 参数（如 `utm_*`） | ⏸ **接受并记入遗留**：spec 只定义 5 个状态键；保留未知参数需引入 `useSearchParams` + Suspense 边界，收益不抵风险 |
| P2-3 | **分析未覆盖真实 UI 搜索**：埋点只在 `/api/search`，而访客走 SSR 搜索页 → 痛点 5 实际未解决 | ✅ **已修**（重要）：`loadSearchPageData` 同样埋点；端到端验证 0 → 2 |
| P2-4 | 建议与搜索共用 `search` 桶，打字可把真实搜索挤出配额 | ✅ **已修**：新增独立 `suggest` 桶（120/60s） |
| P2-5 | admin 隐私文案称「只存查询词与结果数」，实际还存 locale/timestamp/筛选维度 | ✅ **已修**：文案改为「查询词、语言、筛选条件与结果数量」 |
| P2-6 | `cleanup` 用全局 `WINDOW_MS` 而非各桶 `windowMs`（当前无害，属潜在缺陷） | ✅ **已修**：桶内记录自身 `windowMs` |
| P2-7 | 500 响应泄露 `error.message`（内部信息泄露） | ✅ **已修**：改为通用文案，细节只进服务端日志 |
| P2-8 | **中文建议对 ≥3 字前缀失效**（候选只有 bigram，`服务端` 匹配不到任何候选） | ✅ **已修**（重要）：补「整段短语（≤12 字）」候选 + 「前缀包含候选」反向匹配 |
| P2-9 | 部分测试偏弱：S18 单元测试两边调同一函数；时效加权用例只断言 `length>=2`，删掉加权仍通过；查询解析未测 `1e999`/`-0`/`from>to`/空字节/正则元字符 | ✅ **部分已修**：<br>① 时效加权改为**顺序断言**（用两篇文本完全相同、仅日期不同的文档，移除 `applyRecencyWeight` 必失败）；<br>② 新增 12 项极端输入用例；<br>③ S18 另做**真实端到端**验证（见 §5） |
| P2-10 | `RelatedContentList.tsx` 注释称「客户端组件」但无 `'use client'` | ✅ **已修**：注释改为准确描述 |
| P2-11 | `sort=relevance` 被显式写入 URL（噪声） | ✅ **已修**：归一化为不写入 |

**处置统计**：11 项 P2 → **9 项已修**，2 项（P2-2、P2-9 的单元测试局限）明确记入遗留清单。

---

## 4. 评审人执行的门禁（原始输出）

```
$ npm test 2>&1 | tail -15
 Test Files  22 passed (22)
      Tests  302 passed (302)
   Duration  137.22s

$ npx tsc --noEmit 2>&1 | head -20
(no output — clean)

$ npx eslint <18 个批次 2 文件> 2>&1 | tail -20
(no output — zero error / zero warning)
```

---

## 5. 作者对 P2-9「S18 单元测试同义反复」的回应

评审人的批评**成立**：`searchService.test.ts` 的 S18 用例两侧都调用 `rankDocs`，
属同义反复，**不能**证明 `useSearch` 没有分叉。

因此**另做了一次真实端到端 S18**：启动 dev server 后，
- 服务端侧：请求 `/api/search?q=…`（走完整服务层）；
- 客户端侧：请求 `/api/search/index` 取回文档 → 本地 `createSearchIndex` →
  `rankDocs`（即 `useSearch` 内部所用的同一组函数）→ 取 id 序列；
- 比对 6 组中英查询，**7/7 全部一致**。

脚本存档于 `deployment/run_s18_e2e.test.ts`，结果见 `deploy_report.md` S18 条目。
这是对评审意见的**技术研判后加强**，而非简单接受或忽略。

---

## 6. 评审人明确声明未能验证的事项

- 深层链接筛选 URL 的实时 SSR 行为、浏览器前进/后退、打字同步竞态——评审时未起 dev server，结论基于静态分析 + 单元级验证。
- 「`globalThis` 单例跨 `next dev` 各 route 模块实例共享」的端到端验证。
- `npm run build`（不在本轮请求的门禁内，由阶段 8 执行）。
- 真实 Notion 路径（未做任何外部调用）。
- 第 61 次请求触发 429 的并发时序（逻辑已审阅，未做压测）。

> 上述第 1、2、5 项已由作者在阶段 9 部署验证中补做（见 `deploy_report.md` S16/S18/S19/S21）。
