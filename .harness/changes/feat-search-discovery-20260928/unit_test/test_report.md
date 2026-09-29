# 单元测试报告（阶段 5）

- **变更**：feat-search-discovery-20260928
- **阶段**：阶段 5 单元测试编写
- **路径选择**：**A 路径（引入/使用测试框架）**
  —— 说明：`.harness/agents/application-owner.md` 阶段 5 记载「项目无测试框架」，
  但**该记载已过时**：仓库实际已配置 vitest（`vitest.config.ts` + `package.json` 的
  `"test": "vitest run"`），且改造前已有 11 个测试文件 / 122 个用例。
  故本次走 A 路径，未新引入任何框架。
- **结论**：✅ `npm test` 全绿（22 文件 / 313 用例），新增测试覆盖需求指定的全部模块。

---

## 1. 测试执行结果（真实输出）

```bash
$ npm test
> vitest run

 RUN  v4.1.10 /mnt/tos/workspace

 Test Files  22 passed (22)
      Tests  313 passed (313)
   Duration  133.73s
```

对照改造前基线：11 文件 / 122 用例 → 22 文件 / 313 用例。
**既有 122 个用例全部保持通过，无回归。**

---

## 2. 新增测试文件与覆盖点

需求要求新增测试覆盖：**分词器、查询解析/过滤、排序确定性、搜索建议、分析聚合、
分页边界、相关推荐排序**，且每个新纯函数模块都要有对应测试文件；基准集 fixture
要有对应的召回测试（中文/混合/英文三类查询命中期望文档）。

| 需求要求 | 测试文件 | 用例数（约） | 关键断言 |
|---|---|---|---|
| 分词器 | `cjkTokenizer.test.ts` | 16 | 中英混排切分、`next.js↔nextjs` 等价、空/纯标点/emoji、超长片段按**码点**截断、增补平面「𠮷」识别、索引侧 unigram∪bigram、查询侧仅 bigram |
| 索引与检索 | `searchIndex.test.ts` | 17 | 中文词命中标题中段、**非词头子串**（指南/渲染/性能优化）、中英混合、单字查询、空/纯标点查询、超长查询不抛错、序列化往返一致、`highlight` XSS 转义 |
| 排序确定性 | `searchRanking.test.ts` | 18 | 同分按 id 升序（交换输入顺序结果不变）、比较器全序、时效因子半衰期/未来日期夹紧、`applyRecencyWeight` 不改入参且可复现、推荐评分与 `sameTypeOnly` |
| 查询解析/过滤 | `searchQuery.test.ts` | 25 | 默认值、全部合法参数、非法 type/sort/日期 → 解析失败、`language` 旧参数兼容、数组值 searchParams、标签大小写不敏感精确匹配、时间范围含边界、**极端输入**（`1e999`/`-0`/全角数字/`from>to`/空字节/正则元字符标签） |
| 分页边界 | `searchQuery.test.ts` | 6 | page=2&pageSize=5 切片与元信息、越界 → 空集不报错、page=0/负数夹到 1、空集合、页大于总数 |
| 搜索建议 | `searchSuggest.test.ts` | 19 | 英文词头匹配（不匹配词中）、中文按包含匹配、**≥3 字 CJK 前缀**、候选来自索引内容而非写死数组、limit 边界、空前缀/空索引 |
| 分析聚合 | `searchAnalytics.test.ts` | 20 | 脱敏（去控制字符/截断）、**事件不含 IP/UA 等字段**、热门词与零结果词聚合、排序确定性、忽略空白查询、环形缓冲上限、`globalThis` 钉住 |
| 相关推荐排序 | `searchService.test.ts` | 8 | 同类型优先、排除自身、共享标签、推荐理由本地化、可复现、语言感知 |
| 检索服务 / 两端一致 | `searchService.test.ts` | 14 | 分页元信息与切片、越界空集、响应形状（id/refId/type/score）、**索引缓存只构建一次**、服务端 vs 客户端 id 序列一致 |
| **基准集召回** | `searchBenchmark.test.ts` | 4 | fixture 结构（12 条 en4/zh4/mixed4）、**12 条全部满足召回下界且无误召回**、四类查询确定命中、单字中文查询 |
| 响应安全 | `safeJson.test.ts` | 7 | 转义后**无损**（解析结果与原文全等）、报文无字面量 `<script>`、U+2028/2029、中文/emoji 不受影响、超长不抛错 |
| 种子与适配层 | `localSeeds.test.ts` | 19 | 项目 ≥6 且双语齐全、博客 ≥6、id/slug 唯一、**既有 10 篇未被删除**、**基准集引用的 id 均存在**、适配层展平为标量、language 取值与 `searchData` 过滤器一致、HTML→blocks |
| 文案对齐 | `searchI18n.test.ts` | 5 | **`searchTexts` EN/ZH key 完全对齐**、函数型文案两侧均为函数、字符串型非空、`messages/en.json` 与 `zh.json` 全文件 key 零漂移 |

---

## 3. 测试设计取向（避免「摆设」断言）

本次测试刻意规避了几类常见的无效断言：

1. **不写同义反复的断言**。例如 S18 的单元用例两侧都调 `rankDocs`，评审人正确指出
   它无法证明 `useSearch` 未分叉。**因此另做真实端到端 S18**（HTTP 双路径比对，
   7/7 一致），见 `deploy_report.md`。这是对「测试必须断言真实行为」的正面回应。
2. **时效加权用顺序断言而非存在性断言**。构造两篇**文本完全相同、仅日期不同**的文档，
   MiniSearch 相关分必然相同 → 顺序只能由时效加权决定；移除 `applyRecencyWeight` 该用例必失败。
3. **负面断言成对出现**。基准集每条查询同时有 `expectAnyOf`（召回下界）与
   `expectNoneOf`（精确性下界），并断言 12 条反向用例全部通过——防止「提高召回靠放宽匹配」的假改善。
4. **安全类断言针对具体攻击面**。`highlight` 与 `safeJson` 的用例断言的是
   「报文/输出中不存在可执行片段」与「转义后语义无损」，而非仅「不抛异常」。
5. **边界值来自实际缺陷驱动**。如审增补平面 CJK、评审 P2-8 的 3 字中文前缀，
   都是先发现真实缺陷再补的回归用例。

---

## 4. 已知未覆盖（诚实声明）

| 未覆盖项 | 原因 |
|---|---|
| React 组件的渲染/交互行为（点击筛选、下拉建议、键盘导航） | 项目 `vitest` 配置为 `environment: 'node'`，无 jsdom/testing-library，本项目既有测试也全部是纯函数/服务层测试。组件行为改由**阶段 9 的 SSR HTML 级端到端验证**覆盖（S19/S20/S21） |
| `/api/search` 路由级单测（400/429 分支） | 既有测试仅对 `/api/comments`、`/api/admin/comments` 做路由级测试；搜索路由的 400/429 分支由**部署验证的 curl 证据**覆盖（S5/S12/S16） |
| `useSearch` 客户端 hook 的分叉风险 | 无 jsdom；改由真实端到端 S18 覆盖 |
| 浏览器前进/后退的真实历史行为 | 沙箱无浏览器；改由「URL 驱动 + SSR 直出」的结构性验证覆盖（S19） |
