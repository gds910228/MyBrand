# Spec - 内容草稿/发布状态机 + 定时发布

> 日期:2026-08-11。状态:阶段1 产出,待阶段2 评审。
> 本文含三段必备内容:§1 功能描述 / §2 影响页面(EN/ZH) / §3 验收标准。

## 0. Notion 博客库字段实查(2026-08-11,真实 API 查询结果)

通过 `notion.databases.retrieve` 实查 `NOTION_BLOG_DATABASE_ID`(DB title: "Blog"):

| 字段 | 类型 | 现状 |
|---|---|---|
| `Status` | select | **已存在**,options = `[Draft, Published]`(首字母大写)。抽样 3 条均为 `Published` |
| `scheduledAt` | - | **不存在**,需用户手动新增(HITL-1) |
| `Language` | select | options = `[English, Chinese]` |
| `Slug`/`PublishDate`/`Title`/`Tags`/`Summary` 等 | - | 已存在,维持不变 |

**HITL-1 待用户手动新增的 Notion 字段(代码对其缺失做防空,不阻塞上线):**
1. `Status` select 新增选项 `Scheduled`(首字母大写,与现有 `Draft`/`Published` 风格一致;API 写入不存在的 select 选项时 Notion 会自动创建,但建议手动新增以控制命名)。
2. 新增 date 类型属性 `scheduledAt`(存 ISO 时间,Notion date.start)。

**兼容旧数据**:任何文章无 `Status` 值(空)一律视为 `published`;未知非空状态值(如未来手误新增的选项)一律视为 `draft`(宁可隐藏不可泄露,与现状「仅 Published 可见」行为对齐)。

## 1. 功能描述

为博客内容引入「草稿 / 定时 / 已发布」状态机,并新增内容管理后台与定时发布能力。

### 1.1 状态机与数据层

- 代码级状态枚举:`ContentStatus = 'draft' | 'scheduled' | 'published'`(小写)。
- Notion 值映射(大小写不敏感归一化 `normalizeStatus`):
  - `draft`/`Draft` → `draft`;`scheduled`/`Scheduled` → `scheduled`;`published`/`Published` → `published`;
  - **空/缺失 → `published`**(兼容旧数据);**其它未知非空值 → `draft`**(防泄露,保守隐藏)。
- 公开查询收口:`getAllBlogPosts` 移除 Notion 侧 `Status equals 'Published'` 硬过滤,改为应用侧 `normalizeStatus(post.status) === 'published'` 过滤(理由:大小写不敏感统一收口、Status 属性被删时不致查询 400、与「无 status 视为 published」兼容)。所有公开消费方(博客列表 EN/ZH、详情、相关文章、sitemap、搜索、首页 LatestPosts、SmartRecommendations、not-found 推荐)天然只拿得到 published。
- 博客详情页:draft/scheduled 文章的 slug 在 published 列表中查不到 → `notFound()` → 404(EN+ZH 两套,含 generateMetadata)。
- 新增(`src/services/contentStatus.ts`,独立文件,避免 notion.ts 无限膨胀):
  - `listAllBlogPostsWithStatus(options?)`:后台用,返回全状态文章(id/slug/title/status/scheduledAt/createdAt/language/date)。
  - `getPostBySlugWithStatus(slug)`:后台/预览用,不限状态按 slug 取单篇。
  - `setStatus(id, status)`:写 Notion `Status` select(写规范名 `Draft`/`Scheduled`/`Published`),输入校验 + 防空 + 失效博客列表缓存;成功返回 `{ok:true, slug}`(slug 取自 pages.update 响应)。
  - `setScheduledAt(id, iso | null)`:写/清 `scheduledAt` date 字段;字段不存在时返回 `{ok:false, error:'scheduledAt-field-missing'}` 优雅降级不崩溃。
- **状态变更后的 ISR 刷新(P1 修复)**:详情页 `revalidate=300`,published→draft 后若不刷新,已缓存详情页最长 300s 仍可公开访问,验收「直接访问 404」会失败。因此:`POST /api/admin/content/status` 成功后必须调 `revalidateBlogPaths([slug])`(路由层组合,服务层保持 Notion 纯净);`schedule` 变更不影响可见性,不刷新;cron 发布每篇成功后刷新(§1.3)。两处均额外追加 `/sitemap.xml`(sitemap 构建期缓存,不刷新则新发布文章长期不进 sitemap)。
- `notion.ts` 仅小改:`getAllBlogPosts` 过滤方式改造 + 映射补 `scheduledAt` + 导出 `invalidateBlogListCache()`;`getBlogPostById` 映射补 `scheduledAt`/规范 status。不内联 SDK 于页面。

### 1.2 草稿预览(token 保护)

- 新增 `GET /api/content/[id]/preview?token=`:
  - 无 token → 400;token 错误/过期/id 不匹配 → 401(带 reason);`getBlogPostById` 返回 null → 404(该函数对「不存在」与「Notion 异常」均返回 null,不区分,编码按此现状实现);路由级未捕获异常 → 500;通过 → 200 返回草稿渲染数据(post meta + content blocks + status)。
  - token = HMAC-SHA256(postId + 过期时间),密钥读 `PREVIEW_TOKEN`;**未配置 `PREVIEW_TOKEN` 时降级(P1 修复)**:使用**进程启动时生成的随机密钥**(`crypto.randomBytes(32)`,模块级常量,非源码常量——源码常量可被读库者伪造 token 窃取草稿全文),并在服务端控制台打印预览 URL + token(不抛错崩溃),便于本地无 Key 验证;进程重启后旧 token 失效,本地场景可接受。
  - token 有效期 7 天,常量时间比较(timingSafeEqual),复用订阅系统的 HMAC 模式。
  - 预览 token 由后台列表接口(`/api/admin/content`)按篇生成下发(`previewUrl`),同时 console 打印(降级场景可见)。

### 1.3 定时发布

- 新增 `GET /api/cron/publish`(Node runtime):
  - 鉴权(P2 顺手修复,语义钉死):`Authorization: Bearer <CRON_SECRET>` **优先**,无 Bearer 时才看 `?secret=`;两者均缺/均错 → 401。**`CRON_SECRET` 未配置 → 401 并在响应与控制台提示需配置**(不抛错)。Vercel Cron 触发时自动携带 `Authorization: Bearer $CRON_SECRET`,故线上无需把 secret 写进 vercel.json。
  - 扫描 `status=scheduled` 文章:`scheduledAt` 存在且 `<= now` → 逐篇 `setStatus(published)`;`scheduledAt` 缺失/非法/未来 → 计入 skipped;**单篇失败隔离**(逐篇 try/catch)计入 failed。
  - 返回 `{ ok, processed, failed, skipped, details: [{id, slug, result|error}] }`(processed/failed/skipped 为计数)。
  - 每篇成功发布后,通过共享 helper `revalidateBlogPaths(slugs)`(`src/services/revalidate.ts`)直接调 `revalidatePath` 刷新 `/blog`、`/zh/blog`、`/blog/<slug>`、`/zh/blog/<slug>`,并追加 `/sitemap.xml`(与 `/api/revalidate` 同一机制,避免 HTTP 自调用的秘钥/网络依赖;此点为需求「调用 /api/revalidate 钩子」的同机制实现,见 §5 决策 D5)。
- 提供 `vercel.json.example`(可选示例,不直接生效):每小时 cron 配置 + 注释说明每天写法。本地用 `curl /api/cron/publish?secret=xxx` 手动触发验证。

### 1.4 内容管理后台 /admin/content

- 新增 `src/app/admin/content/page.tsx`(client 组件,沿用 /admin/notify 的 sessionStorage 密码模式,密码 = `ADMIN_TOKEN`):
  - 列出全部文章(含 draft/scheduled/published):状态标签(带色 badge)、scheduledAt、createdAt、语言、slug、标题。
  - 操作:改状态(draft↔scheduled↔published 下拉/按钮)、设置/清除 scheduledAt(datetime-local 输入)、复制预览链接、手动触发「立即发布到期文章」(= cron 同逻辑)。
  - 深色模式(`dark:` 变体)+ 移动端适配(flex/grid 响应式)。
- 新增 admin API(Node runtime,ADMIN_TOKEN 鉴权):
  - `GET /api/admin/content` → 全状态文章列表(含 previewUrl)。token 走 `Authorization: Bearer <ADMIN_TOKEN>` 头(避免 query 出现在访问日志,顺手修 P2)。
  - `POST /api/admin/content/status` `{id, status, token}` → 输入校验(缺 id/非法 status → 400;未授权 → 401/403);成功后调 `revalidateBlogPaths([slug])` + `/sitemap.xml`(见 §1.1 P1 修复)。
  - `POST /api/admin/content/schedule` `{id, scheduledAt(ISO|null), token}` → 非法日期 → 400。
  - `POST /api/admin/content/publish-due` `{token}` → 触发与 cron 相同的发布逻辑(复用 service)。
- **ADMIN_TOKEN 鉴权与本地降级(P1 修复,语义钉死)**:统一 helper `checkAdminAccess(request)`(`src/lib/adminAuth.ts`):
  - `ADMIN_TOKEN` **已配置** → 必须提供匹配 token(头或 body),不匹配 → 401。
  - `ADMIN_TOKEN` **未配置** → 仅当 `request.headers.get('host')`(**只读 Host 头,绝不读 `x-forwarded-host`** —— 后者可被客户端伪造,伪造后生产环境未配 token 即全网获得 admin 写权限)为 `localhost` / `127.0.0.1` / `[::1]`(去端口比较)时放行,并 `console.warn` 告警;否则 → 403。不抛错崩溃。
  - 已有 `/api/admin/posts`、`/api/admin/notify` 维持 REVALIDATE_SECRET 不动(不过度重构)。
- i18n:admin 文案走 next-intl 消息文件单一来源 —— 项目实际未挂载 NextIntlClientProvider(既有事实,见 `src/lib/subscribeMessages.ts` 注释),沿用既定 `getXxxMessages(locale)` 模式:新增 `src/lib/adminMessages.ts` + `en.json`/`zh.json` 新增 `admin` 命名空间(key 一一对应),页面内置 EN/中文 切换(localStorage 持久化,默认 en)。

### 1.5 /api/revalidate 改造

- 保持现有 `?path=` 重复参数与默认路径行为不变(向后兼容)。
- 新增 `?slug=<slug>`(可重复):自动展开为该文的 `/blog`、`/zh/blog`、`/blog/<slug>`、`/zh/blog/<slug>` 四条路径。
- 路径执行逻辑抽到 `src/services/revalidate.ts` 的 `revalidateBlogPaths(slugs)` / `revalidatePaths(paths)`,cron 与 route 共用;`REVALIDATE_SECRET` 未配置拒绝运行的现有约束(500)保持不变。

## 2. 影响页面(EN/ZH)

| 影响点 | EN | ZH | 说明 |
|---|---|---|---|
| 博客列表页 | `src/app/blog/page.tsx` | `src/app/zh/blog/page.tsx` | 不改文件:过滤在服务层收口(getAllBlogPosts)。验证草稿不出现 |
| 博客详情页 | `src/app/blog/[slug]/page.tsx` | `src/app/zh/blog/[slug]/page.tsx` | 不改文件:draft/scheduled → notFound() 404 |
| 相关文章 | `src/components/RelatedPosts.tsx` | (共享组件) | 不改:输入已是 published 列表 |
| 搜索 | `src/services/searchData.ts` + `/api/search*` | (共享) | 不改:复用 getAllBlogPosts |
| sitemap | `src/app/sitemap.ts` | (共享) | 不改:复用 getAllBlogPosts |
| 首页/推荐 | LatestPosts、SmartRecommendations、not-found 页 | (共享) | 不改:复用 getAllBlogPosts |
| 数据层 | `src/services/notion.ts`(改)、`src/services/contentStatus.ts`(新)、`src/services/revalidate.ts`(新) | (共享) | 见 §1.1/§1.5 |
| 纯逻辑层(可单测) | `src/lib/contentStatus.ts`、`src/lib/previewToken.ts`、`src/lib/scheduledPublish.ts`(新) | (共享) | 状态归一化/过滤、token 签发校验、到期发布核心 |
| 预览端点 | `src/app/api/content/[id]/preview/route.ts`(新) | (共享) | token 三态 |
| cron 端点 | `src/app/api/cron/publish/route.ts`(新) | (共享) | + `vercel.json.example` |
| admin 后台 | `src/app/admin/content/page.tsx`(新)、`src/app/api/admin/content/**`(新) | 页内 EN/中文 切换 | 文案 `src/i18n/messages/{en,zh}.json` 新增 `admin.*` + `src/lib/adminMessages.ts` |
| revalidate | `src/app/api/revalidate/route.ts`(改) | (共享) | 加 `?slug=`,抽 shared helper |

**ISR 影响**:状态变更/定时发布后通过 `revalidatePath` 精确刷新受影响路径;`blogListCache`(60s)在写操作后主动失效,避免草稿泄露窗口。

## 3. 验收标准

- [ ] 公开面:Notion 中把某篇设为 `Draft` → 触发 `/api/revalidate?slug=<slug>` 后,EN `/blog`、ZH `/zh/blog`、`/sitemap.xml` 均不出现;直接访问 `/blog/<slug>` 与 `/zh/blog/<slug>` 返回 404;搜索结果在索引 ISR(600s)窗口内可能残留,窗口后必不出现(与遗留 P2 口径一致)。
- [ ] 兼容旧数据:无 Status 值的文章仍正常出现在公开列表(视为 published)。
- [ ] 预览:`/api/content/<id>/preview` 无 token → 400;错误 token → 401;正确 token → 200 返回草稿数据;未配 `PREVIEW_TOKEN` 时控制台打印 token 且流程可用。
- [ ] 定时发布:构造 scheduled + 过去时间 → `curl /api/cron/publish?secret=xxx` 后变 published 且 {processed≥1};未来时间 → 不转(计入 skipped);单篇失败不影响其它;`CRON_SECRET` 未配置 → 401。
- [ ] ISR:发布后 `/blog`、`/zh/blog`、详情页 EN/ZH 被 revalidate(cron 响应/details 可见);`/api/revalidate?slug=<slug>&secret=` 展开 4 条路径。
- [ ] 后台:`/admin/content` 列出全状态文章;可改状态、设/清 scheduledAt、复制预览链接、手动触发到期发布;ADMIN_TOKEN 未配置时本地可用 + 控制台告警;深色模式与移动端正常;EN/中文 文案切换正常且两份 JSON key 对齐。
- [ ] 单测(A 路径):`npm test` 真实跑通 vitest 且 total>0,覆盖 a) 状态过滤(含旧数据兜底) b) cron 发布(到期/未到期/失败隔离) c) 预览 token 三态 d) 状态流转输入校验。
- [ ] 门禁:`npm run lint` exit 0、`npm run build` 成功。

## 4. 新增环境变量

| 变量 | 必填 | 未配置行为 |
|---|---|---|
| `PREVIEW_TOKEN` | 否 | 降级:内置开发密钥签名 + 控制台打印 token/预览 URL |
| `CRON_SECRET` | 否 | `/api/cron/publish` 拒绝运行(401 + 提示) |
| `ADMIN_TOKEN` | 否 | admin API 仅允许 localhost 访问 + console.warn 告警 |
| `REVALIDATE_SECRET` | 已有 | 不变(未配置时 /api/revalidate 拒绝运行) |

## 5. 关键决策记录(HITL-1 单次执行不暂停,采纳最稳妥项)

- **D1 状态映射**:Notion 规范选项名用首字母大写 `Draft/Scheduled/Published`(与现状一致),代码归一化为小写枚举;空→published(兼容旧数据),未知值→draft(防泄露)。
- **D2 过滤收口在应用侧**而非 Notion 查询过滤:大小写不敏感统一处理、Status 属性缺失不崩、公开面单一 choke point。代价:草稿行会被拉取后丢弃(百级数据量可忽略)。
- **D3 admin i18n 不走 Provider**:项目未挂载 NextIntlClientProvider 是既有架构事实,挂载属需求外重构;沿用 `getAdminMessages(locale)` + en/zh.json 单一来源模式,页内语言切换。
- **D4 cron 鉴权**同时支持 `?secret=` 与 `Authorization: Bearer`(Vercel Cron 自动携带 CRON_SECRET 的标准模式)。
- **D5 cron 后 ISR 刷新**用共享 helper 直接 `revalidatePath`(与 /api/revalidate 同机制同代码路径),而非 HTTP 自调用 —— 消除自调用对 REVALIDATE_SECRET/部署 URL 的依赖,更稳妥;/api/revalidate 本身仍保留并增强(§1.5),供外部手动触发。
- **D6 vercel.json 以 `.example` 提供**:直接提交生效中的 vercel.json 会在下次部署立即激活 cron,未经用户确认不替用户开通;示例文件 + 说明更稳妥。
- **D7 预览内容以 JSON 渲染数据返回**(meta + blocks),不做独立预览页面 —— 需求只要求「返回草稿渲染数据」的端点;后台可复制预览链接供外部工具/前端复用 NotionRenderer。
- **D8 scheduled 无 scheduledAt**:API 允许(宽松),cron 计 skipped,后台 UI 提示补时间 —— 不阻塞用户操作,又不静默发布。

## 6. 评审修订记录

### v1 → v2(2026-08-11,spec_review_v1 REJECTED 修复)
- P1-1(已修,§1.1/§1.4):状态变更路由成功后补 `revalidateBlogPaths` + `/sitemap.xml` 刷新,消除 published→draft 后 ISR 300s 泄露窗口。
- P1-2(已修,§1.4):本地降级判定钉死只读 Host 头,不读 x-forwarded-host,防伪造绕过。
- P1-3(已修,§1.2):预览降级密钥改为进程启动随机密钥,杜绝源码常量被伪造。
- P2(本次顺手修):cron 鉴权 Bearer 优先语义钉死(§1.3);sitemap 纳入刷新范围(§1.3/§1.1);admin GET 改 Authorization 头(§1.4);`scheduledAt-field-missing` 错误码大小写统一(§1.1);预览 404/500 语义钉死(§1.2)。
- P2(遗留,记入 summary.md 遗留清单):`limit` 在应用侧过滤后可能返回少于 limit 的 published(not-found 推荐位影响小);`/api/search*` 索引 600s ISR,下架后最长 ~10 分钟搜索残留(可接受,下期可加 revalidate);blogListCache 多实例不失效(60s TTL 自愈)。
