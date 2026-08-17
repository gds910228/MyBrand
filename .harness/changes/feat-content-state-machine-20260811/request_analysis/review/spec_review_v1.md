# Spec Review v1 — 内容草稿/发布状态机 + 定时发布

- 评审日期:2026-08-11
- 评审对象:
  - `.harness/changes/feat-content-state-machine-20260811/request_analysis/spec.md`
  - `.harness/changes/feat-content-state-machine-20260811/request_analysis/tasks.md`
- 评审方式:逐条对照原始需求,并打开 `src/services/notion.ts`、`src/app/blog/[slug]/page.tsx`(EN/ZH)、`src/app/sitemap.ts`、`src/services/searchData.ts`、`src/app/api/search/route.ts`、`src/app/api/search/index/route.ts`、`src/app/api/revalidate/route.ts`、`src/app/api/admin/posts/route.ts`、`src/middleware.ts`、`src/lib/subscribeMessages.ts` 等源码核实。
- **结论:REJECTED**(存在 3 条 P1,需修订后复审;无 P0)

---

## Strengths(具体,非客套)

1. **Notion 字段实查扎实**:§0 用真实 API 查询确认了 `Status` select options=[Draft, Published](首字母大写)、`scheduledAt` 不存在,并以 HITL-1 清单交代人工前置动作;代码对字段缺失做防空,不阻塞上线。与源码 `notion.ts:571`(`Status equals 'Published'` 硬过滤)及 `notion.ts:759`(`status` 映射现状)完全对得上。
2. **公开面收口点选择正确**:经逐一核对,所有公开消费方——EN/ZH 列表页(`blog/page.tsx:25`、`zh/blog/page.tsx:24`)、EN 详情页 EN→ZH 回退(`blog/[slug]/page.tsx:79`)、ZH 详情页(仅查 Chinese,`zh/blog/[slug]/page.tsx:65`)、sitemap.ts:9-10、searchData.ts:18、LatestPosts.tsx:15、SmartRecommendations.tsx:49、两个 not-found 页、notify 流(`getBlogPostBySlugForNotify` 内部也走 `getAllBlogPosts`,notion.ts:1971)——全部经 `getAllBlogPosts` 单一入口取数。在应用侧收口过滤后**不存在 P0 级 draft 直接泄露路径**。
3. **兼容映射方向保守正确**:空/缺失 Status → published(兼容旧数据,与现状「所有现存文章可见」行为一致);未知非空值 → draft(宁可隐藏)。大小写归一化与现有 `Draft`/`Published` 命名风格对齐。
4. **D3/D5/D6 决策尊重现状且稳妥**:不强行挂 NextIntlClientProvider(与 `subscribeMessages.ts` 注释记录的架构事实一致);cron 后 ISR 刷新用共享 helper 直接 `revalidatePath`,消除 HTTP 自调用对部署 URL/密钥的依赖;`vercel.json.example` 不替用户擅自开通 cron。
5. **tasks 原子粒度与跨任务签名一致**:`normalizeStatus`/`runScheduledPublish`/`revalidateBlogPaths` 的签名在 T1/T2/T3 间一致,自审映射(spec 章节 → 任务)完整无 TBD;纯逻辑/lib、服务/services、鉴权/路由三层拆分干净,直接支撑阶段5 单测。

---

## Issues

### P0(致命)

无。公开消费方已全部核对,收口方案成立,未发现 draft/scheduled 内容可绕过的直接泄露路径。

### P1(必须修)

**P1-1 状态变更路径缺少 revalidatePath,spec §2 承诺与 tasks 实现矛盾,published→draft 后最长 300s 仍可公开访问**
- 锚点:spec §2「ISR 影响:状态变更/定时发布后通过 revalidatePath 精确刷新受影响路径」、§3 验收「Notion 中把某篇设为 Draft → …直接访问 /blog/\<slug\> 与 /zh/blog/\<slug\> 返回 404」;对照 tasks T2.2(`setStatus` 只做「失效博客列表缓存」)与 T3.4(status 路由只调 `setStatus`),**均没有 revalidatePath**。
- 为何重要:详情页 `revalidate = 300`(EN `blog/[slug]/page.tsx:2`、ZH `zh/blog/[slug]/page.tsx:2`),列表页同为 300s。通过 admin 后台把一篇已发布文章改为 Draft 后,已缓存的详情页 HTML 在最长 5 分钟内继续公开服务该文全文——这正是本功能要防的泄露场景,且按 §3 验收标准直接操作时会失败。cron 发布方向(T3.2)有 `revalidateBlogPaths`,唯独 admin 手动改状态方向漏了。
- 修法:T2.2 `setStatus` 成功后(或 T3.4 status 路由内)对受影响 slug 调 `revalidateBlogPaths([slug])`;slug 需在写操作前先查出(setStatus 入参只有 id)。同时在 tasks 中补一条对应验收:改状态后立即 404/出现。

**P1-2 ADMIN_TOKEN 未配置时的 localhost 判定未指定 host 来源,存在 x-forwarded-host 伪造实现风险**
- 锚点:spec §1.4「仅允许本地访问(请求 host 为 localhost/127.0.0.1)」;tasks T3.4 `checkAdminAccess`「未配→仅 localhost/127.0.0.1 host 放行」。两处均未说明「host」取自哪个字段。
- 为何重要:若实现者取 `x-forwarded-host`(Next 部署中常见习惯),该头可被客户端任意伪造——生产环境未配置 ADMIN_TOKEN 时,任何人加 `X-Forwarded-Host: localhost` 即可获得全量 admin 写权限(改状态、清定时、触发发布)。这是把「开发降级」变成「生产越权」的一步之遥。Vercel 上 Host 头由平台路由控制、不可伪造,因此必须钉死来源。
- 修法:spec/tasks 明确「只读 `Host` 头 / `request.nextUrl.hostname`,**禁止**使用 `x-forwarded-host`/`x-forwarded-server`」;并在 T6 单测中为 `checkAdminAccess` 补用例(伪造 x-forwarded-host 必须 403)。

**P1-3 PREVIEW_TOKEN 未配置时的「内置开发密钥」若为源码常量,预览 token 可被任何人伪造**
- 锚点:spec §1.2「未配置 PREVIEW_TOKEN 时降级:用内置开发密钥签名」;tasks T3.1「secret = PREVIEW_TOKEN || 内置开发密钥」。
- 为何重要:HMAC 的安全性完全依赖密钥保密。若「内置开发密钥」是提交进仓库的字符串常量,则生产环境忘配 PREVIEW_TOKEN 时,任何读过源码的人都能为任意 postId 自签有效 token,预览端点形同无鉴权,草稿全文(content blocks)泄露。「控制台打印 token」在密钥公开的前提下不增加任何安全性,只增加便利。
- 修法:降级密钥改为**进程启动时随机生成**(`crypto.randomBytes(32)`,模块级缓存):本地 console 打印的预览 URL 照常可用(满足需求「未配置降级为控制台打印 token」),但远程不可伪造、重启即失效;同时在 `NODE_ENV=production` 且未配置时 `console.warn` 醒目告警。spec §1.2 与 T1.2/T3.1 同步修订。

### P2(记录,后续处理)

**P2-1 `getAllBlogPosts` 的 limit/分页语义在应用侧过滤后变化**
- 锚点:spec §1.1/D2;notion.ts:589(`page_size: options?.limit || 100`)、not-found 页 `limit: 6`/`limit: 20`。
- 现状 Notion 侧过滤发生在 limit 之前;改为应用侧过滤后,若最近 N 条里混入 draft,not-found 推荐位会显示更少甚至 0 条;总条数 >100 时,排在 100 条窗口外的 published 文章会被草稿挤掉(D2 只回应了「拉取量可忽略」,未回应 limit 交互)。
- 修法:limit 场景拉取后过滤再 `slice(0, limit)`(page_size 固定 100),或在 spec 明示接受该窗口。

**P2-2 刷新范围不含 sitemap 与搜索索引,下架后存在更长残留窗口**
- 锚点:spec §1.3/§1.5 `revalidateBlogPaths` 只含 `/blog`、`/zh/blog`、双语详情;`/api/search/route.ts:18` 与 `/api/search/index/route.ts:14` 均 `revalidate = 600`(后者还带 `s-maxage=600`);`sitemap.ts` 无 `revalidate` 导出(构建期静态化,现有 /api/revalidate 默认路径也不含它)。
- 影响:published→draft 后,草稿标题/摘要在搜索索引最长残留约 20 分钟;sitemap.xml 残留更久(直至重新部署或显式 revalidate)。cron 新发布的文章同样延迟进入 sitemap。注意原始需求只要求刷新「blog 列表+详情+双语路径」,故此不定 P1。
- 修法:spec 明示接受该窗口,或将 `/sitemap.xml`、`/api/search/index` 纳入刷新清单并说明 query 变体的处理。

**P2-3 admin token 经 query/body 传递的泄露面**
- 锚点:spec §1.4 `GET /api/admin/content?token=`、POST body 带 token;T4.2 sessionStorage 模式。
- `?token=` 会进入浏览器历史、代理/服务器访问日志。既有 `/api/admin/posts?password=` 同病(非本次引入)。建议改 `Authorization`/`X-Admin-Token` 头;至少 spec 中记录该取舍。

**P2-4 cron 鉴权优先级与 401/403 语义未钉死**
- 锚点:spec §1.3 同时支持 `?secret=` 与 `Authorization: Bearer`,未定义两者同现且不一致时的优先级;§1.4「未授权 → 401/403」二选一写法含糊。
- 修法:固定「Bearer 优先,query 兜底」;未带凭证 401、带错凭证 401、非本地降级拒绝 403,写进 tasks。

**P2-5 「TDD」表述与任务顺序矛盾**
- 锚点:tasks T6 标题「TDD:先写测试跑红,再实现/修正跑绿」,但依赖顺序为 T1→…→T5→(阶段5)T6,实现先于测试。
- 实际流程是先编码后补测,称 TDD 名不副实;要么调整表述,要么把 lib 层测试前移到 T1 同批。不影响正确性,影响流程审计口径。

**P2-6 小一致性问题(打包记录)**
- spec §1.1 约定 `setScheduledAt` 字段缺失返回 `error:'scheduledat-field-missing'`,T2.2 泛化为 `{ok:false, error}`——建议保留该稳定错误码供 UI 提示「请先在 Notion 新增 scheduledAt 字段」。
- 预览路由(T3.1)对「id 不存在」与 Notion 异常都返回 404(`getBlogPostById` catch 返回 null,notion.ts:1021-1024),错误可观测性差,建议区分 404/502。
- `blogListCache` 为实例内存缓存(notion.ts:81),`invalidateBlogListCache` 只清当前实例;serverless 多实例下最长 60s 陈旧窗口(现状即有,变更后影响面相同),spec §2「避免草稿泄露窗口」的表述应弱化为「缩短」。

---

## Recommendations

1. 先修 3 条 P1 再进编码:P1-1 补 revalidate(slug 先查后写)、P1-2 钉死 host 来源并加伪造用例、P1-3 降级密钥改随机化。三处改动量都很小,但都直接决定「draft 不泄露」这一核心承诺是否成立。
2. 验收标准 §3 第一行建议补操作路径限定:「通过 admin API/后台改为 Draft 后**立即** 404;直接改 Notion 后经 /api/revalidate 或 TTL 后 404」——否则测试时 ISR 窗口会造成误判。
3. admin token 建议趁本次新 API 直接上 header 传递(P2-3),与旧 API 并存即可,不必回改。
4. T6 建议为 `checkAdminAccess` 与 cron 鉴权补纯函数级单测(把鉴权判断抽成可注入 env/headers 的纯函数),让「伪造 x-forwarded-host 拒绝」「Bearer 优先」两条进入回归。

---
*评审人:资深需求评审 reviewer(Next.js 14 / Notion CMS / next-intl / ISR)。所有结论均已对照源码核实。*
