# Tasks - 内容草稿/发布状态机 + 定时发布

> 按 writing-plans 原子粒度拆解,每个任务一次原子提交。提交信息遵循半角冒号规范(`feat:`/`chore:`/`docs:` 等)。
> 项目压缩包无 .git,T0 先 git init;在 main 分支直接开发(项目约定)。
> 纯逻辑收进 `src/lib/`(可单测,不依赖 Next runtime);Notion 交互收进 `src/services/`;路由只做鉴权+参数校验+调服务。

## To Do

### T0 基建
- [ ] T0.1 `git init` + 首次基线提交(`chore: 导入项目基线`),`.gitignore` 已存在(node_modules/.next/.env*.local 等),确认 .env.local 不入库
- [ ] T0.2 `.env.local` 追加(可选,本地验证用):`PREVIEW_TOKEN`、`CRON_SECRET`、`ADMIN_TOKEN`(均留空值注释,验证降级路径时再按需启用)

### T1 纯逻辑层(`src/lib/`,TDD 友好,无 Next 依赖)
- [ ] T1.1 `src/lib/contentStatus.ts`:
  - `export type ContentStatus = 'draft' | 'scheduled' | 'published'`
  - `normalizeStatus(raw?: string | null): ContentStatus` — 大小写不敏感;空/缺失→`'published'`;未知非空→`'draft'`
  - `isPubliclyVisible(raw?: string | null): boolean` — `normalizeStatus(raw) === 'published'`
  - `toNotionStatusName(status: ContentStatus): 'Draft' | 'Scheduled' | 'Published'`
  - `isValidContentStatus(v: unknown): v is ContentStatus`
  - `isValidISODate(v: unknown): boolean` — 字符串且 `!isNaN(Date.parse(v))`
  - 提交:`feat: 新增内容状态归一化纯函数`
- [ ] T1.2 `src/lib/previewToken.ts`:
  - `generatePreviewToken(postId: string, secret: string, expiresAtMs: number): string` — base64url(payload).base64url(HMAC-SHA256)
  - `verifyPreviewToken(postId: string, token: string | null, secret: string, nowMs: number): { valid: boolean; reason?: 'no-token'|'malformed'|'bad-signature'|'wrong-post'|'expired' }` — timingSafeEqual
  - `getPreviewSecret(): string` — `PREVIEW_TOKEN || 进程级随机密钥`(模块加载时 `crypto.randomBytes(32)` 生成,**非源码常量**,防伪造;未配置时 console.warn 降级提示)
  - 提交:`feat: 新增草稿预览 token 签发与校验`
- [ ] T1.3 `src/lib/scheduledPublish.ts`:
  - `selectDueScheduledPosts<T extends {status?: string|null; scheduledAt?: string|null}>(posts: T[], now: Date): { due: T[]; skipped: T[] }` — scheduled 且 scheduledAt 合法且 <= now → due;scheduled 但缺/非法/未来时间 → skipped;其余不进结果
  - `runScheduledPublish<T extends {id: string; slug?: string}>(opts: { posts: T[]; now: Date; publish: (post: T) => Promise<void> }): Promise<{ processed: string[]; failed: {id: string; error: string}[]; skipped: string[] }>` — 逐篇 try/catch 失败隔离
  - 提交:`feat: 新增定时发布核心逻辑(到期筛选+失败隔离)`

### T2 数据层改造
- [ ] T2.1 `src/services/notion.ts` 改造:
  - `getAllBlogPosts`:Notion 查询移除 `Status equals 'Published'` 过滤(保留 Language 过滤与 PublishDate 排序);映射补 `scheduledAt: props.scheduledAt?.date?.start || null`;返回前应用侧 `isPubliclyVisible(p.status)` 过滤
  - 导出 `invalidateBlogListCache(): void`(清空 blogListCache)
  - `getBlogPostById`:映射补 `scheduledAt` + `status: normalizeStatus(...)`(规范小写)
  - 父页面兜底模式:无 Status 概念,`normalizeStatus(undefined)='published'` 天然兼容,不改
  - 提交:`refactor: 博客列表状态过滤收口到应用侧并补 scheduledAt 映射`
- [ ] T2.2 `src/services/contentStatus.ts` 新建(自建 notion Client + BLOG_DATABASE_ID,不改动 notion.ts 内部私有状态;写操作后调 `invalidateBlogListCache()`):
  - `listAllBlogPostsWithStatus(options?: { language?: string }): Promise<AdminPostItem[]>` — 全状态(不加状态过滤),字段:id/slug/title/status(规范小写)/scheduledAt/createdAt/date/language;无 key/DB → 返回 `[]`
  - `getPostBySlugWithStatus(slug: string): Promise<AdminPostItem | null>` — 不限状态
  - `setStatus(id: string, status: ContentStatus): Promise<{ok:true; slug: string} | {ok:false; error:string}>` — 校验 status 合法;写 `Status: {select:{name: toNotionStatusName(status)}}`;防空(无 key/DB → skipped 风格错误返回);失效缓存;slug 取自 pages.update 响应(供路由层 revalidate)
  - `setScheduledAt(id: string, iso: string | null): Promise<{ok:true} | {ok:false; error:string}>` — iso 非 null 时校验 `isValidISODate`;写/清 `scheduledAt` date 字段;Notion 报字段不存在等 400 → 返回稳定错误码 `{ok:false, error:'scheduledAt-field-missing'}`(可判定消息含 property 名),其它错误原样透传,不抛
  - `listScheduledPostsRaw(): Promise<{id, slug, status, scheduledAt}[]>` — cron 用,全量拉取后由 lib 筛选
  - 提交:`feat: 新增内容状态服务层(列表/单查/流转/定时字段)`
- [ ] T2.3 `src/services/revalidate.ts` 新建:
  - `revalidatePaths(paths: string[]): { revalidated: string[]; errors: {path: string; error: string}[] }` — 逐条 try/catch 包 `revalidatePath`
  - `BLOG_BASE_PATHS = ['/blog', '/zh/blog']`;`revalidateBlogPaths(slugs: string[])` — base + `/blog/<slug>` + `/zh/blog/<slug>` 展开
  - 提交:`feat: 抽取 revalidate 路径刷新共享 helper`

### T3 API 路由(均遵循 try/catch + NextResponse.json 模板,Node runtime)
- [ ] T3.1 `src/app/api/content/[id]/preview/route.ts` 新建:`GET` — token 缺失→400;`verifyPreviewToken` 失败→401(带 reason);`getBlogPostById(id)` 返回 null(不存在或 Notion 异常,该函数两种情形均返回 null,不区分)→404;路由级未捕获异常→500;成功→200 `{ post: {id,title,excerpt,status,scheduledAt,date,tags,content,...} }`。secret 取 `getPreviewSecret()`(`PREVIEW_TOKEN` 或进程随机密钥),降级时 `console.warn` 提示。提交:`feat: 新增草稿预览端点(token 三态校验)`
- [ ] T3.2 `src/app/api/cron/publish/route.ts` 新建:`GET` — `CRON_SECRET` 未配置→401+提示;鉴权 **Bearer 头优先、无 Bearer 再看 `?secret=`**,均缺/错→401;`listScheduledPostsRaw()` → `runScheduledPublish`(publish = setStatus(published) + `revalidateBlogPaths([slug])` + `revalidatePath('/sitemap.xml')`)→ 200 `{ok, processed, failed, skipped, details}`。`export const dynamic = 'force-dynamic'`。提交:`feat: 新增定时发布 cron 端点`
- [ ] T3.3 `src/app/api/revalidate/route.ts` 改造:新增可重复 `?slug=` 参数(展开走 `revalidateBlogPaths`);原有 `?path=` 与默认路径、`REVALIDATE_SECRET` 约束、`?notify=` 全部不变;执行逻辑改调 `revalidatePaths`。提交:`feat: revalidate 支持按 slug 批量刷新双语路径`
- [ ] T3.4 admin API 新建 `src/app/api/admin/content/`(统一 adminAuth helper `src/lib/adminAuth.ts`:`checkAdminAccess(request, token?): { allowed: boolean; status?: 401|403; error?: string }` — `ADMIN_TOKEN` 已配→比对 token;未配→**仅 Host 头**(`request.headers.get('host')`,去端口,绝不读 x-forwarded-host)为 localhost/127.0.0.1/[::1] 放行 + `console.warn`,否则 403):
  - `route.ts` `GET`(token 走 `Authorization: Bearer` 头)→ `listAllBlogPostsWithStatus` + 每篇附 `previewUrl`(generatePreviewToken,降级时 console 打印)
  - `status/route.ts` `POST` `{id, status, token}` → 缺 id/非法 status→400;`setStatus` 成功后 `revalidateBlogPaths([slug])` + `revalidatePath('/sitemap.xml')`(修 spec_review_v1 P1-1)
  - `schedule/route.ts` `POST` `{id, scheduledAt, token}` → 非 null 且非法日期→400;`setScheduledAt`
  - `publish-due/route.ts` `POST` `{token}` → 与 cron 同逻辑(复用 `runScheduledPublish`)
  - 提交:`feat: 新增内容管理 admin API(鉴权+流转+定时+手动发布)`

### T4 管理后台页面
- [ ] T4.1 i18n 文案:`src/i18n/messages/en.json` 与 `zh.json` 新增 `admin.content.*`(标题/状态标签 draft/scheduled/published/表格列/按钮/提示/错误),key 一一对应;新建 `src/lib/adminMessages.ts`(`getAdminMessages(locale)`,静态 import 两份 JSON,同 subscribeMessages 模式)。提交:`feat: 新增内容后台双语文案`
- [ ] T4.2 `src/app/admin/content/page.tsx` 新建(client 组件):
  - sessionStorage 密码(= ADMIN_TOKEN;本地降级时任意/留空可进,由 API 鉴权兜底)登录门
  - 全状态文章表格(移动端转卡片列表):状态 badge(draft 灰/scheduled 黄/published 绿)、scheduledAt、createdAt、语言、标题、slug
  - 操作:状态下拉切换、datetime-local 设置/清除 scheduledAt、复制预览链接(navigator.clipboard)、「立即发布到期文章」按钮(调 publish-due)、刷新列表
  - EN/中文 切换(localStorage `admin_locale`,默认 en);深色 `dark:` 变体;`export const dynamic = 'force-dynamic'` 不需要(client 页)
  - 提交:`feat: 新增内容管理后台页面 /admin/content`

### T5 部署配置示例与文档
- [ ] T5.1 `vercel.json.example`:`{"crons":[{"path":"/api/cron/publish","schedule":"0 * * * *"}]}` + 文件内无法注释,配套说明写进 coding report 与交付文档(每天:`0 0 * * *`)
- [ ] T5.2 `CLAUDE.md` 的 Environment Setup 段补三个新 env 说明(PREVIEW_TOKEN/CRON_SECRET/ADMIN_TOKEN)
- [ ] 提交:`docs: 补充 cron 配置示例与环境变量说明`

### T6 单元测试(阶段5,A 路径)
- [ ] T6.1 `npm install -D vitest`;新建 `vitest.config.ts`(node 环境,`@/` alias 对齐 tsconfig paths);package.json `test` 脚本改为 `vitest run`。提交:`chore: 引入 vitest 测试框架`
- [ ] T6.2 `src/lib/__tests__/contentStatus.test.ts`:a) normalizeStatus 各分支(大小写/空→published/未知→draft) b) filterPublished 场景:draft/scheduled 不出现,无 status 旧数据兜底 published c) isValidContentStatus/isValidISODate 校验分支(对应流转 API 输入校验)
- [ ] T6.3 `src/lib/__tests__/scheduledPublish.test.ts`:到期转 published、未来时间不转、无 scheduledAt 跳过、单篇失败隔离(processed/failed/skipped 计数正确)
- [ ] T6.4 `src/lib/__tests__/previewToken.test.ts`:无 token/错误 token/过期 token/错误 postId/正确 token 五态;adminAuth host 伪造用例(x-forwarded-host: localhost 不得放行)
- [ ] T6.5 `npm test` 真实跑通,total>0,输出贴 test_report.md;**测试暴露的任何实现缺陷走「红→修→绿」循环并在报告记录**(不虚构)。提交:`test: 新增状态机/定时发布/预览token 单元测试`

## 依赖顺序
T0 → T1 → T2 → T3 → T4 → T5;(阶段5)T6。T4 依赖 T3 的 API;T3 依赖 T1/T2。

## 自审记录(writing-plans Self-Review)
- spec §1.1→T1.1/T2.1/T2.2;§1.2→T1.2/T3.1;§1.3→T1.3/T2.3/T3.2/T5.1;§1.4→T3.4/T4;§1.5→T2.3/T3.3;§3 单测→T6。无遗漏。
- 无 TBD/TODO 占位;类型签名跨任务一致(normalizeStatus/ContentStatus/runScheduledPublish/revalidateBlogPaths)。
