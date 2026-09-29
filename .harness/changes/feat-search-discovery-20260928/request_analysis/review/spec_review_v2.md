# 需求评审报告 v2（复评）

- **变更**：feat-search-discovery-20260928
- **阶段**：阶段 2 需求评审（第 2 轮）
- **评审对象**：`spec.md`（含新增「§8 v2 修订记录」）+ `tasks.md`（含「v2 补入任务」）+ v2 期间已落盘的检索内核代码
- **评审人**：独立 reviewer subagent（与 v1 同一评审人，仅复核阻塞项）
- **评审轮次**：第 2 轮
- **结论**：✅ **APPROVED**（需求阶段）

> v1（`spec_review_v1.md`）结论为 REJECTED，已保留不删。本轮为针对 v1 阻塞项的真实复评，
> 评审人**独立重跑了 12 条基准查询**（自行从种子重建展平语料 + 使用仓库真实
> `MINISEARCH_OPTIONS`/`runSearchAll`），未采信作者自述。

---

## 1. 阻塞项逐条销项

| 编号 | 状态 | 销项依据 | 残留 |
|---|---|---|---|
| P1-1 限流 vs S16/S24 | ✅ RESOLVED | spec §8.1 + tasks T11（补入 `src/lib/rateLimit.ts` 命名桶）；`search` 桶 60/60s；S16 用 `10.0.0.16` 第 61 次触发 429，S24 用 `10.0.0.24` 20 次全 200 | 实现待编码；deploy_report 中 S1–S15 若共用默认 IP 桶，累计须 <60 或逐项使用独立 `x-forwarded-for` |
| P1-2 locale × language | ✅ RESOLVED | spec §8.2 + fixture 逐条 `locale` + tasks「验收口令修订」 | tasks 矩阵中 S2–S4 行仍为裸示例，由全局说明约束 |
| P1-3 S18 排序分叉 | ✅ RESOLVED | spec §8.3 + 决策 D-08/D-11：单一 `searchRanking.ts`、服务端与客户端共用 `applyRecencyWeight`+`sortHits`、小时取整时效基准 | S18 成立依赖 `useSearch` 真正接入共用管线（当前 `useSearch.ts:118` 仍调裸 `runSearch`，实现待做）；客户端 limit 30 vs 服务端 page 20，须比较 top-N 重叠 |
| P1-4 `useSearch.ts` 未列 | ✅ RESOLVED | spec §8.4 + T16 已列入；D-11 明确结果列表以服务端 props 为准 | — |
| P1-5 内存单例不共享 | ✅ RESOLVED | spec §8.5 + D-09；T08/T13 均要求钉 `globalThis` | 内存实现仅适用 dev/单实例，作者已列为遗留项 |
| D-1 fallback 爆炸半径 | ✅ RESOLVED | spec §8.6 + D-10：仅在「原本必然返回 null/[]」的路径生效 | 行为变更须写入 deploy_report「行为变更」小节；S23 须断言 200/404 语义不变 |
| D-2 适配层返回形状 | ✅ RESOLVED | spec §8.7 逐字段钉死（展平为标量 + 合成 `date`/`createdTime`） | 适配层已落盘（`src/data/localContent.ts`） |
| C-5 admin 文案 | ✅ RESOLVED | spec §8.8：沿用 `adminMessages.ts` 静态引入模式，新增 `searchAnalytics` 命名空间 EN/ZH 成对 | — |
| C-6 类型放置 | ✅ RESOLVED | spec §8.9 + T07：新增 `src/types/search.ts` 承载跨层契约 | `ProjectType`/`BlogPostType` 保留原处（理由充分，记为遗留） |
| A-1 过程交付物 | ✅ RESOLVED | spec §8.10 + T20（`summary.md` 按能力块追加）/ T21（评审版本化，旧版不删） | — |
| B-2 id 语义 | ✅ RESOLVED | spec §8.3：`id = <type>:<refId>` 全局唯一，另保留 `refId` 兼容旧口径 | §2 契约表未同步列出 `refId`（§8.3 声明「以本节为准」，属表述瑕疵，非阻塞） |
| **B-1 OR/AND 矛盾（核心）** | ⚠️ spec 已 RESOLVED / **tasks 曾有陈旧表述** | spec §2A + §8.13 作废 D-04，明确「查询侧仅 bigram + 全局 AND，无 OR 降级」 | **`tasks.md` T05 原写「新增『片段内 OR』两段式检索」，与 §8.13 直接冲突。已在本轮后修正为 AND-only，并同步更正 T03「既有 11 篇」→「既有 10 篇」** |

## 2. 评审人对核心技术主张的独立验证

评审人**未采信作者的冒烟结论**，自行重建语料并运行仓库真实检索内核：

**方法**：从 `src/data/blog.ts` + `src/data/projects.ts` 按 spec §8.7 的展平规则重建语料 →
用仓库真实 `MINISEARCH_OPTIONS` / `runSearchAll` 跑 fixture 全部 12 条查询。

**结果**：
```
en-1 nextjs              PASS
en-2 tailwind css        PASS
en-3 typescript generics PASS   （确认 post-11 英文标题确实同时含两词）
en-4 docker              PASS
zh-1 入门                -> [blog:post-1]                        PASS
zh-2 指南                -> [blog:post-11, blog:post-1, blog:post-7] PASS
zh-3 渲染                -> [blog:post-10, project:proj-2, blog:post-12] PASS
zh-4 性能优化            -> [blog:post-12]                       PASS
mix-1 ~ mix-4                                                   PASS
                                        （含 mix-4「Tailwind 响应式」-> [blog:post-2]）
TOTAL FAILURES: 0/12
```
- **12 条 `expectNoneOf` 反向断言全部未被误召回**。
- 单字中文查询可用（索引侧有 unigram）：`性→[post-12, proj-6]`、`渲→[post-10, proj-2, post-12]`。
- 评审人指出：作者的 `scratch.smoke.test.ts` 证据**真实但不足**——它用的是手搓 7 文档玩具语料、
  仅 8 条查询、仅 2 条反向断言，且**未覆盖适配层展平与语言过滤**。评审人的独立 12/12 全量跑
  （真实种子 + 真实展平）补齐了这一缺口，设计主张成立。

## 3. v2 引入的新阻塞项

**无。** 唯一由 v2 引入的不一致是非阻塞的 `tasks.md` T05 措辞问题（见上表 B-1 行），
且即使按该措辞实现（片段内 bigram OR），12 条基准仍会通过——v1 所担心的风险来自 unigram OR，
而查询侧 bigram 分词根本不会产出 unigram。已在复评后修正以保持一致。

## 4. 带入编码阶段的残留风险（P2）

1. `tasks.md` T05 措辞与 T03 篇数已在复评后修正 ✅
2. **交付前删除 `scratch.smoke.test.ts`**（spec §2A 已声明；该文件匹配 `src/**/*.test.ts`，会被 `npm test` 采集）
3. S24 的「索引不重复构建」须归因于 **`searchIndexCache`（globalThis）**，**不得**归因于 ISR（spec §8.3 B-3 已更正）
4. `localContent.ts` **必须**为每篇文档设置 `language` 字段，否则 `src/services/searchData.ts:71-73`
   的语言过滤会静默纳入跨语言文档；由 T18 的 `localSeeds.test.ts` 守住
5. `/api/search` 的 60/60s 桶 + S1–S23 共用默认 IP 桶，仍可能在 deploy_report 中产生**虚假 429**；
   须控制累计次数或逐项使用独立 `x-forwarded-for`
6. S18 的确定性依赖「客户端与服务端共用管线 + 小时取整基准时间」；亚小时边界竞态可接受，
   但**须有测试断言并在文档中写明**
7. `highlight` 仍跳过单字 CJK 词（`length >= 2` 过滤）——已确认**不在** S1–S24 验收范围内，保持现状

---

**结论**：v1 全部 P1 阻塞项已销项，核心技术主张经评审人独立 12/12 全量复现验证。
**APPROVED**，可进入阶段 3 编码实现。
