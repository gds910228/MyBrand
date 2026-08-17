# 变更追溯 - feat: 内容草稿/发布状态机 + 定时发布

> Single Source of Truth。每阶段完成后立即更新。

## 基本信息
- **变更类型**：feat
- **需求名称**：content-state-machine
- **创建日期**：2026-08-11
- **来源**：用户单次执行 Prompt（`.autocase/input/prompt.md`）
- **开发分支**：`main`(本项目默认在 main 开发,不切 feature 分支;项目压缩包无 .git,阶段3 前 git init)

## 阶段状态

| 阶段 | 状态 | 评审轮次 | 门禁证据 | 备注 |
|---|---|---|---|---|
| 1 需求分析 | ✅ | - | spec 三段齐全+Notion 实查 | HITL-1 已决议(8 项) |
| 2 需求评审 | ✅ | 2轮(v1 REJECTED→v2 APPROVED) | spec_review_v1/v2 | v1: 3P1(状态变更漏ISR刷新/Host头伪造面/预览降级密钥可伪造);v2 全清,新增4条P2措辞已顺手修 |
| 3 编码实现 | ✅ | - | 改动文件 lint 0 error;build exit 0 | T0-T5 完成,6 次原子提交;全量 lint exit=1 为历史遗留(14 个未改动文件),本次文件 0 命中 |
| 4 编码评审 | ✅ | 2轮(v1 APPROVED 0P0/0P1+3P2→修复后 v2 APPROVED) | code_review_v1/v2 | v1 据实 APPROVED(spec 评审 P1 前置修复覆盖了漏过滤/吞异常/防空/ISR 风险类,reviewer 逐类核验干净);P2-1/P2-2/P3-2 已修并 v2 核验 |
| 5 单测编写 | ✅ | - | npm test exit 0,4文件32例全绿 | A 路径;vitest 4.1.10;一次真实红→绿(token 过期边界 now>=exp) |
| 6 单测评审 | ✅ | 1轮(APPROVED 0P0/0P1+5P2) | test_review_v1 | P2-2/P2-5 顺手修(新增2用例);P2-3 不采纳(od 实证 fixture 为正确模板串,系 shell 展开误读);余留档 |
| 7 代码提交 | ✅ | - | git status 干净 | main 分支,9 次原子提交,半角冒号规范 |
| 8 CI验证 | ✅ | - | ci_result.md:scoped lint exit0/build exit0(39/39)/test exit0(32例) | 全量 lint 26 个历史遗留 error 另行治理;沙箱 EPERM 抖动已重跑排除 |
| 9 部署验证 | ✅ 已用本地等价验证完成 | - | deploy_report.md:首轮 8 组 + 补充 4 组 + 交付前自检(门禁+端点+不可见性)全过 | 本地等价验证(dev:env + next start + 真实 Notion);E2E 发现并修复预览降级密钥缺陷 1 例;交付前自检完成 cron 真实到期发布(processed:1);scheduledAt 字段与 Scheduled 选项已就位 |
| 10 用户确认 | 🔄 待确认 | - | 交付汇报(本会话末条消息) | HITL-4 |

## 现状探明(阶段1 已读代码)

- **博客库已有 `Status`(select) 字段**,现有查询过滤 `Status equals 'Published'`(notion.ts:571)。返回值已带 `status` 字段(notion.ts:759,1015)。
- **无 `scheduledAt` 字段**(代码中无任何引用,待实查确认)——列入 HITL-1 待用户手动新增。
- 公开内容消费单一 choke point:`getAllBlogPosts`(blog 列表 EN/ZH、详情页、sitemap、searchData、LatestPosts、SmartRecommendations、not-found 页全部走它)。详情页 slug 查不到即 404。
- 后台预览需要按 id 取任意状态文章:`getBlogPostById` 无状态过滤,可直接复用。
- **项目实际未挂载 NextIntlClientProvider**:既定模式是 i18n JSON + `getXxxMessages(locale)` helper(见 src/lib/subscribeMessages.ts)。admin 文案沿用此模式(单一来源 en.json/zh.json)。
- 现有 admin 体系:`/admin/notify`(client 组件,密码复用 REVALIDATE_SECRET,sessionStorage 存密码,硬编码中文文案) + `/api/admin/posts` + `/api/admin/notify`。
- `/api/revalidate`:GET,secret 校验(未配置返回 500),支持重复 `?path=` 批量,默认 `/,/zh,/blog,/zh/blog`,可选 `?notify=<slug>`。Node runtime。
- 订阅系统已有 HMAC token 签名/校验模式(notion.ts signToken/verifyToken,timingSafeEqual),预览 token 复用该模式。
- token 密钥现状:订阅系统复用 REVALIDATE_SECRET。本需求要求 PREVIEW_TOKEN / CRON_SECRET / ADMIN_TOKEN 三个新 env(均有降级行为)。

## HITL 决议记录(单次执行模式:不暂停,列待决议项+建议+采纳最稳妥项)

### HITL-1 需求决议(阶段1,2026-08-11,单次执行不暂停,自采纳最稳妥项)
**Notion 实查结果(真实 API 查询,非臆断)**:
- Blog 库 `Status` = select,options=`[Draft, Published]`,抽样 3 条均 Published;**无 `scheduledAt` 字段**;`Language` select=`[English, Chinese]`。
- **待用户手动新增**:① `Status` 增加选项 `Scheduled`;② 新增 date 属性 `scheduledAt`。代码已设计防空:字段缺失时读侧视为 null、写侧优雅报错不崩溃。

**已决议(决策依据见 spec §5)**:
1. D1 状态映射:Notion 选项名首字母大写(`Draft/Scheduled/Published`),代码归一化小写枚举;空值→published(兼容旧数据),未知值→draft(防泄露)。
2. D2 状态过滤收口到应用侧(getAllBlogPosts 单一 choke point),不再依赖 Notion 查询过滤。
3. D3 admin i18n 沿用项目既定 `getAdminMessages(locale)` 模式(项目未挂载 NextIntlClientProvider,挂载属需求外重构)。
4. D4 cron 鉴权支持 `?secret=` + `Authorization: Bearer`(Vercel Cron 标准)。
5. D5 cron 后 ISR 用共享 helper 直接 revalidatePath(同机制,避免 HTTP 自调用依赖)。
6. D6 vercel.json 以 `.example` 提供(不替用户激活线上 cron)。
7. D7 预览端点返回 JSON 渲染数据(需求原文),不做独立预览页。
8. D8 scheduled 可无 scheduledAt(API 宽松,cron 计 skipped,UI 提示)。

**产出**:request_analysis/spec.md(§0 实查+§1 功能+§2 影响面+§3 验收+§5 决策)、request_analysis/tasks.md(T0-T6 原子任务)。

### HITL-2 评审汇报(单次执行记录)
- 需求评审:v1 REJECTED(3 P1:状态变更漏 ISR 刷新/Host 头伪造面/预览降级密钥可伪造)→ 全部修复 → v2 APPROVED(复审又提 4 条 P2 措辞问题,已顺手修)。
- 编码评审:v1 据实 APPROVED(0 P0/P1;reviewer 逐类核验漏过滤/吞异常/防空/ISR 路径均干净——因 spec 评审已把风险前置修掉);3 P2 中 2 条顺手修(首页纳入刷新范围/文档围栏)→ v2 APPROVED。**说明:编码轮未出现 REJECTED 是真实结果,未为满足流程编造问题**。
- 测试评审:v1 APPROVED(0 P0/P1,5 P2),P2-2/P2-5 顺手修(新增 2 用例),P2-3 不采纳(od 实证 fixture 无误,系查看方 shell 展开误读)。

### HITL-3 部署参数(单次执行记录)
- 无真实部署环境 → 本地等价验证:`npm run dev:env`(降级路径)+ `next start` 生产模式(ISR/revalidate 真实行为)双环境 curl。
- cron 200 验证用临时 `CRON_SECRET=test-cron-secret-123`/`final-check-cron-secret` 启动验证服务器;三个新 env 在 .env.local 以注释占位,由用户按需启用。
- Notion 写验证仅用临时测试文章(均已 archived),真实文章零改动。
- **交付前自检(2026-08-12)补充**:为完整演示 cron 到期发布,通过 Notion API 新增 `scheduledAt`(date) 属性(HITL-1①②就此全部就位:Scheduled 选项 + scheduledAt 字段);如需移除可在 Notion 删除。

## 门禁证据摘要
- (阶段3) lint:本次 16 个改动文件 `npx next lint --file ...` → ✔ No ESLint warnings or errors;全量 `npm run lint` exit=1(26 个历史遗留 error,均在未改动文件)
- (阶段3) build:`npm run build` exit 0,39/39 页面,7 条新路由编译在册
- (阶段8) lint/build/test:scoped lint `✔ No ESLint warnings or errors`(exit 0);build `✓ Compiled successfully`+`✓ Generating static pages (39/39)`(exit 0);test `Test Files 4 passed (4) / Tests 32 passed (32)`(exit 0)
- (阶段9) revalidate/cron/preview 响应:revalidate `?slug=` → 200 展开 7 路径(`/ /zh /blog /zh/blog /sitemap.xml /blog/<slug> /zh/blog/<slug>`);cron 未配置→401 提示/错 secret→401/正确(query+Bearer)→200 `{processed,failed,skipped,details}`;preview 400/401/200 三态真实通过
- (阶段9) 页面验证 EN/ZH:/blog、/zh/blog、/sitemap.xml、搜索对 draft 0 泄露;draft↔published 双向 round-trip 真实 Notion 写 + ISR 刷新验证通过(临时测试文章,已归档)

## 遗留 P2
- (需求评审遗留,已记录于 spec §6):①应用侧过滤后 limit 语义变化(not-found 推荐位可能少于 limit,影响小);②`/api/search*` 索引 600s ISR,下架后最长 ~10 分钟搜索残留(验收口径已在 spec §3 对齐);③blogListCache 多实例不失效(60s TTL 自愈)。
- (编码评审留档):cron/admin 密钥比较为普通字符串相等(与既有 revalidate 同模式,远程时序攻击实际不可利用);getPostBySlugWithStatus 为需求指定 API 面暂无内部调用方。
- (阶段9 发现,既有行为):详情页 notFound() 因流式渲染返回 HTTP 200 而非 404,对所有不存在 slug 一致,非本次引入;建议单开变更修复(详情页 try/catch 对 NEXT_NOT_FOUND 的处理)。
- (测试评审留档):verifyPreviewToken 两个深度防御分支(坏 JSON payload/exp 非 number)无用例;env/console spy 清理在测试体末尾而非 afterEach(现有用例自检 env,无虚假绿风险)。
