# 编码评审报告 v2 - 复审(修复提交 1c03387)

> 日期:2026-08-11。评审人:资深 reviewer(Next.js 14 App Router / TS / Notion CMS / 安全)。
> 评审范围:`1c03387`(fix: 编码评审反馈),即 v1 APPROVED 后的唯一修复提交;基准为 code_review_v1.md 的 3 P2 + 5 P3。
> **结论:APPROVED**(修复真实、正确,无新引入 P0/P1/P2;v1 全部 P2 闭环,P3 处置符合约定)。

## 复审门禁(真实复跑)

| 门禁 | 结果 |
|---|---|
| `npx next lint --file` 修复提交触及文件 + 4 个 revalidateBlogPaths 调用方(共 6 文件) | exit 0,0 warning(eslint-disable 注释位置有效) |
| `npx tsc --noEmit` | exit 0 |
| en/zh.json 严格 JSON.parse + 全文件扁平化 key diff | 两文件均合法;扁平化 key 各 130,单侧独有 key = 0 |
| 工作区状态 | HEAD=1c03387,tree clean,无夹带未提交改动 |

## 逐项核验

### 修复 1:P2-1 CLAUDE.md 围栏 — 已修,正确
- diff 仅删 1 行(原 87 行残留的 ` ``` `)。
- 实测 `grep -n '```' CLAUDE.md` 现仅 4 个围栏:40/50、60/82 两对,全部配对(CLAUDE.md:40,50,60,82)。
- 目检 CLAUDE.md:60-88:env 代码块 60 行 ```bash 开、82 行 ``` 合,其后「Notion blog database manual fields」为正文,「## Content Management」(CLAUDE.md:88)恢复为标题渲染。渲染塌陷问题消除。

### 修复 2:P2-2 首页 LatestPosts 残留窗口 — 已修,正确,调用方语义无副作用
- src/services/revalidate.ts:38:`new Set<string>(['/', '/zh', ...BLOG_BASE_PATHS, '/sitemap.xml'])`,首页双语确已入列;空 slug `continue` 防护(revalidate.ts:40)与 Set 去重语义未动;注释同步更新(revalidate.ts:33-34),说明与实现一致。
- 四个调用方逐一核验(均为 `force-dynamic` 路由处理器、请求期执行,revalidatePath 上下文合法):
  - src/app/api/admin/content/status/route.ts:39 — 状态变更后刷新;首页入列后 published→draft 的首页 60s 残留窗口被消除,正是 P2-2 诉求。
  - src/app/api/cron/publish/route.ts:52 — 定时发布逐篇刷新;新发布文章即刻可进首页 LatestPosts,语义正确。
  - src/app/api/admin/content/publish-due/route.ts:30 — 与 cron 同逻辑,同上。
  - src/app/api/revalidate/route.ts:56 — ?slug= 展开路径现含首页,与该路由既有默认路径回退(route.ts:64 `['/', '/zh', '/blog', '/zh/blog']`)口径一致,反而更自洽。
- 副作用核验:`revalidatePath('/')` 对静态路径默认按 page 粒度、惰性失效(下次访问重建),非 layout 级整站 purge;首页本就 60s ISR(src/app/page.tsx、src/app/zh/page.tsx),重建成本有界。Set 内仅新增 2 条静态路径,无 fan-out 风险。

### 修复 3:P3-2 死文案 key — 已修,正确
- page.tsx:94 `setListError(err?.message || t.loadFailed)`,`t.loadFailed` 在 en/zh.json 均存在(en:"Failed to load" / zh:"加载失败"),经 adminMessages.ts:13-15 `getAdminMessages` 取 `admin.content`,类型 `typeof en.admin.content` 保证编译期可查(tsc 复跑 exit 0 佐证)。
- eslint-disable 位置:page.tsx:98 注释紧贴 99 行 `}, [authHeaders]);`(exhaustive-deps 的报告行),与同文件 103-104 行既有且 v1 已验证通过的抑制模式完全一致;lint 复跑 0 warning,抑制生效。
- 依赖语义:`t` 未入 deps 是有意取舍——loadPosts 仅在 authHeaders(token)变化时重建;locale 切换后 error 兜底文案可能为上一语言。该兜底仅在 err.message 为空时触发、且文案仍可读,不构成实际 bug(stale locale 文案属评审约定可接受项)。
- `localModeHint` 删除干净:全 src grep 0 引用(exit=1);en/zh.json `admin.content` 顶层各 34 key(扁平化含 status.* 共 36),单侧独有 key 0,插值占位符逐 key 比对 0 不匹配——「36/36 对齐」声明属实(34 顶层 - status 对象 + status 3 子键 = 36 扁平键)。

## v1 P2/P3 最终处置状态

| 条目 | 处置 | 证据 |
|---|---|---|
| P2-1 CLAUDE.md 围栏不配对 | 已修(1c03387) | 本报告「修复 1」 |
| P2-2 首页 LatestPosts 60s 残留 | 已修(1c03387,选扩路径方案) | 本报告「修复 2」 |
| P2-3 密钥比较非 timing-safe | 留档(v1 已注明可接受:远程时序攻击可利用性极低,既存 revalidate/subscribe 同模式;如需拉高可复用 previewToken timingSafeEqual) | code_review_v1.md P2-3 |
| P3-1 死代码 getPostBySlugWithStatus / filterPubliclyVisible | 留档待阶段5(v1 约定:单测中安家用例或删除) | code_review_v1.md P3-1 |
| P3-2 死文案 key localModeHint / loadFailed | 已修(1c03387:loadFailed 启用 + localModeHint 删除) | 本报告「修复 3」 |
| P3-3 en/zh.json 整文件重写 diff 噪音 | 留档(v1 确认 0 key 缺失/变更,无需返工) | code_review_v1.md P3-3 |
| P3-4 Bearer 优先于 body token | 留档(管理页只发 Bearer,无实际触发路径) | code_review_v1.md P3-4 |
| P3-5 schedule 路由漏传字段等价清除 | 留档(管理页总是显式传值,无实际风险) | code_review_v1.md P3-5 |

遗留项全部在 v1 报告内有明确记录与理由,无遗失。

## 新引入问题检查(1c03387)

- P0/P1:无。P2/P3:无。
- 观察项(不构成 issue):提交顺带把 code_review_v1.md 入库、summary.md 增加一行空占位「- (阶段8) lint/build/test:」,与既有阶段9 空占位同风格,属待填文档占位,非代码问题。

## 最终结论

**APPROVED**。三处修复均真实落地且正确:CLAUDE.md 围栏恢复配对;首页纳入 revalidateBlogPaths 后四个调用方语义全部核验无误、无副作用;t.loadFailed 引用与 eslint-disable 位置正确、不产生产实际 bug,en/zh.json 合法且 key 全量对齐。v1 的 3 P2 中 2 条已修、1 条按约定留档,5 P3 中 1 条已修、4 条留档有据。无新引入 P0/P1。可进入阶段5(单测 A 路径),遗留 P3-1 死代码按 v1 约定在阶段5 处置。
