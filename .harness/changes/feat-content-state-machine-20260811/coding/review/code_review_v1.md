# 编码评审报告 v1 - 内容草稿/发布状态机 + 定时发布

> 日期:2026-08-11。评审人:资深 reviewer(Next.js 14 App Router / TS / Notion CMS / 安全)。
> git 范围:`1aee580..HEAD`(6 个提交,22 文件,+1838/-311)。
> 评审基准:spec.md v2(APPROVED)+ tasks.md + coding_report_v1.md。
> **结论:APPROVED**(P0=0,P1=0,P2=3,P3=5;无阻塞项,P2/P3 可在阶段5 顺手修或记入遗留清单)。

## 验证过的大门禁(真实复跑,非采信报告)

| 门禁 | 结果 |
|---|---|
| `npx next lint --file <16 个改动文件>` | exit 0,0 warning |
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | exit 0,39/39 静态页,7 条新路由全部在册(/admin/content、/api/admin/content{,/status,/schedule,/publish-due}、/api/content/[id]/preview、/api/cron/publish)。注:首次复跑曾因沙箱读 node_modules EPERM 报 exit 1,重跑通过,确认为环境抖动非代码问题 |
| en/zh.json 语义 diff(机器比对) | 旧 key 0 缺失 0 变更;新增 admin.content.* 各 37 key,EN/ZH 一一对应,插值占位符一致 |
| 提交信息 | 6 条均半角冒号前缀(feat:/refactor:/docs:) |

## Strengths

1. **过滤收口干净利落**:`getAllBlogPosts` 应用侧 `isPubliclyVisible` 过滤(src/services/notion.ts:782-784)是所有公开取数的唯一 choke point。逐一排查全部消费方——EN/ZH 列表、EN/ZH 详情(含 generateMetadata)、RelatedPosts(输入即已过滤列表)、sitemap.ts、searchData.ts、LatestPosts、SmartRecommendations、三个 not-found、getBlogPostBySlugForNotify(notion.ts:1989-1992 复用列表)、旧 /api/admin/posts——无一例外全部经过过滤。缓存写入在过滤之后(notion.ts:786),无未过滤缓存泄露面。
2. **详情 404 链路正确**:EN 详情 `postsEn.find→postsZh.find`(src/app/blog/[slug]/page.tsx:79)在 draft 场景下两列表均无该 slug → `notFound()`;ZH 同理(zh/blog/[slug]/page.tsx:66)。draft/scheduled 详情 404 成立。
3. **预览 token 实现教科书级**:先验签后解析 payload(src/lib/previewToken.ts:87-98),timingSafeEqual 前置长度检查,wrong-post/expired 区分;未配置时进程级 `crypto.randomBytes(32)` 随机密钥(previewToken.ts:32),杜绝源码常量伪造——正是 spec_review v1 P1-3 的修法。
4. **adminAuth fail-closed**:`hostnameOf` 覆盖带端口/大小写/IPv6 `[::1]:3000`/畸形 `[::1`/空 host(src/lib/adminAuth.ts:32-39),全部落 403;绝不读 x-forwarded-host;已配置 token 时空 token 拒 401。符合 spec v2 P1-2 钉死语义。
5. **ISR 刷新无空 slug 污染**:`revalidateBlogPaths` 对空 slug `continue`(src/services/revalidate.ts:39),不会产生 /blog/undefined;base+sitemap+双语详情一次收齐,status 路由与 cron 共用同一 helper。
6. **slug 读写两侧兜底链一致**:服务层 `deriveSlug`(src/services/contentStatus.ts:43-49)与读取侧 notion.ts:677-683/1035-1038 同为 `slug→Slug→标题派生`,Slug 字段为空时行为一致。
7. **防空到位**:scheduledAt 缺失→null、Status 缺失→normalizeStatus(undefined)='published'、无 key/DB→`[]`/`{ok:false,skipped:'notion-not-configured'}`;每个 service catch 均 console.error 留痕后降级返回,非只吞不报。
8. **cron 边界正确**:`Date.parse(scheduledAt) <= nowMs` 含相等(src/lib/scheduledPublish.ts:38);非法/缺失/未来→skipped;逐篇 try/catch 失败隔离;revalidateBlogPaths 内部逐路径隔离,不会因刷新异常把已成功的状态变更误计 failed。
9. **无需求外改动**:/api/admin/posts、/api/admin/notify 维持 REVALIDATE_SECRET 未动;notion.ts 仅三处小改;getBlogPostById status 归一化小写经全仓 grep 确认无既有 `.status` 消费方,安全。
10. **后台页双布局+双文案**:桌面表格/移动卡片(md 断点切换),dark: 变体齐全;datetime-local 本地时区显示→UTC ISO 存储 round-trip 正确(toLocalInput/new Date().toISOString()),空输入按钮禁用,Invalid Date 路径被 try/catch 兜底。

## Issues

### P0
无。

### P1
无。

### P2

1. **CLAUDE.md 代码围栏不配对,后半篇 markdown 渲染塌进代码块** — CLAUDE.md:82/87。旧文件围栏在 40/50/60/76(配对),本次编辑在 82 行补了一个闭合围栏后,原有的旧闭合围栏残留于 87 行,全文 5 个围栏不配对:87 行的 ` ``` ` 会开启一个永不闭合的代码块,把「## Content Management」起到文末全部渲染为代码。为何重要:CLAUDE.md 是项目门面+AI 协作入口文档,渲染损坏直接影响可读性。修法:删除 87 行多出的 ` ``` `(一行修复)。
2. **下架后首页 LatestPosts 最长 60s 残留窗口未纳入刷新范围、且遗留清单未记录** — src/services/revalidate.ts:30(BLOG_BASE_PATHS 仅 /blog、/zh/blog)+ src/app/page.tsx:12、src/app/zh/page.tsx:10(首页 ISR 60s)。`revalidateBlogPaths` 不刷新 `/`、`/zh`,published→draft 后首页推荐位最长 60s 仍展示该文(自愈)。实现本身符合 spec §1.1 钉死的刷新范围,但 spec §6 遗留清单记录了 search 600s 残留却漏记了这个同质窗口。为何重要:验收口径完整性;60s 窗口影响小,但应像 search 一样显式记录,避免阶段9 验证时误判为 bug。修法:遗留清单补一条;或顺手把 `/`、`/zh` 加进 BLOG_BASE_PATHS(成本极低,二选一)。
3. **cron/admin 密钥比较为普通字符串相等(非 timing-safe)** — src/app/api/cron/publish/route.ts:38(`provided !== cronSecret`)、src/lib/adminAuth.ts:46(`input.token === configured`)、及既存 src/app/api/revalidate/route.ts:45 同款。远程 HTTP 时序攻击对逐字节短路比较的实测可利用性极低(网络抖动远大于比较耗时),且本项目既存 revalidate/subscribe 均同模式,判定**可接受**,按约定注明留档。若日后要统一拉高,可复用 previewToken 的 timingSafeEqual 模式。不阻塞。

### P3(nitpick,不拔高)

1. **死代码**:`getPostBySlugWithStatus`(src/services/contentStatus.ts:105-123)按 spec §1.1 新增但全仓无消费方(预览端点实际走 getBlogPostById);`filterPubliclyVisible`(src/lib/contentStatus.ts:61-63)同样无人使用(notion.ts 直接用 isPubliclyVisible)。修法:或在阶段5 单测中给它们安家用例,或删除。
2. **死文案 key**:en/zh.json 的 `admin.content.localModeHint`、`loadFailed` 定义了但 page.tsx 未引用(37 中 35 在用)。修法:页面补渲染(本地降级时展示 localModeHint 其实体验更好)或删 key。
3. **en.json/zh.json 整文件重写造成 331 行 diff 噪音**:机器比对确认 0 key 缺失/变更,纯重序列化(缩进/行尾),无实际危害,但给评审与日后 blame 增加噪音。记录即可,无需返工。
4. **`checkAdminAccess` 的 Bearer 优先于 body token**(src/lib/adminAuth.ts:82 `bearer || bodyToken`):错误 Bearer + 正确 body token 组合会 401。spec 语义为「头或 body 任一匹配」,当前实现对「同时携带且头错」fail-closed;管理页只发 Bearer,无实际触发路径。记录。
5. **schedule 路由省略字段等价清除**(src/app/api/admin/content/schedule/route.ts:21 `body?.scheduledAt ?? null`):客户端漏传 scheduledAt 会静默清除定时而非 400。管理页总是显式传值,无实际风险;严格起见可对「字段缺失」与「显式 null」区分。记录。

## Recommendations(均非阻塞)

1. 修 P2-1(一行)与 P2-2(遗留清单补记或扩 BLOG_BASE_PATHS),可并入阶段5 的提交。
2. 阶段5 单测建议直接覆盖:adminAuth 的 host 伪造矩阵(x-forwarded-host: localhost 不得放行、`localhost:evil.com`→403、`[::1]:3000`→放行)、selectDueScheduledPosts 的 now 相等边界、verifyPreviewToken 五态——tasks T6.2-T6.4 已列,此处强调 host 解析矩阵别漏。
3. vercel.json.example 的 `$comment` 键:Vercel 对未知顶层键仅告警不拒绝,示例性质可接受;若求严谨可在交付文档注明「复制时可删掉 $comment」。
4. 阶段9 实测时建议加验一条:Status 属性整列被删时公开列表不 400 且全部按 published 兜底(spec D2 的明确取舍,草稿会随之公开——属既定语义,验证即确认)。

## Assessment

实现与 spec v2 的贴合度高:三态状态机、预览三态(400/401/404)、cron 鉴权语义(Bearer 优先、未配置 401)、admin localhost 降级(只读 Host 头)、ISR 精确刷新(含 sitemap)、i18n 双份对齐、dark/移动端,全部落地且经真实门禁复跑验证(lint/tsc/build 全绿,新路由在册)。spec_review v1 的三条 P1(ISR 泄露窗口、Host 伪造面、可伪造预览密钥)在代码中均已正确修复。未发现过滤绕过、吞异常、时序/边界 bug。两条 P2 一为文档渲染缺陷(一行可修)、一为验收口径补记;一条 P2 为注明可接受的既定模式。整体质量可进入阶段5(单测 A 路径)。
