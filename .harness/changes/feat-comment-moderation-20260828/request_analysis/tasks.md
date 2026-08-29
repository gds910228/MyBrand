# 任务拆分：评论系统治理（v2，对齐 spec v2）

> TDD：纯函数/数据层任务先红后绿。无 .git，完成后在 coding_report 记录。

## T1 共享类型
- 新建 `src/types/comment.ts`：CommentStatus、CommentType（+可选 status/spamScore/spamReasons）、CommentAuthor、AdminCommentItem（含作者邮箱）、ModerationResult。
- notion.ts 删本地 CommentType，改 re-export；data/comments.ts 从 types 引入。
- 验证：tsc 无新增错误。

## T2 评分引擎（TDD）
- 测试 `src/lib/__tests__/spamScore.test.ts`（红）：正常 0 分；各规则独立命中正分+reason 码；边界 29/30/69/70；阈值/词表/权重注入；频率注入；中英词表；纯中文不触发 caps；链接语义（scheme/www. 才算；可疑链接同时计数）；关键词大小写不敏感。
- 实现 `src/lib/spamScore.ts`：DEFAULT_SPAM_CONFIG（en/zh 词表、可疑 TLD、一次性邮箱域、权重）、scoreComment、decideModeration。纯函数无时钟/网络/模块状态。
- 验证：测试绿。

## T3 评论树纯函数（TDD）
- 测试 `src/lib/__tests__/commentTree.test.ts`（红）：normalize 兜底；filterApprovedTree 三路径（非 approved 顶级/回复/隐藏父下回复成孤儿）；旧数据无字段可见；**双次调用幂等无重复回复**；不 mutate 输入。
- 实现 `src/lib/commentTree.ts`：normalizeCommentStatus、buildCommentTree（全新对象）、filterApprovedTree。

## T4 邮箱频率 tracker
- `src/lib/commentFrequency.ts`：recordSubmission / recentCountForEmail(windowMs=10min) / resetCommentFrequencyForTest；内存 Map + 清理（仿 rateLimit）。

## T5 本地兜底层统一（TDD，spec v2 P1-1）
- 改造 `src/data/comments.ts` 为唯一本地兜底层（活代码）：扁平种子（3 条无 status，comment-1/2/3）；getLocalCommentsByPostId（filterApprovedTree）、addLocalComment（写三字段）、setLocalCommentStatus、getAllLocalCommentsForAdmin（三态计数+desc+limit）、resetLocalCommentsForTest；建树/过滤全部走 commentTree。
- 测试 `src/lib/__tests__/comments-data.test.ts`（红→绿）：隐藏 pending/spam 顶级与回复；隐藏父下回复；无状态种子可见；setLocalCommentStatus 翻转可见性；admin 计数；唯一 postId 防泄漏 + reset。

## T6 数据层 Notion 接线（notion.ts）
- 新建 `src/lib/notionCommentMapper.ts`（纯）：mapNotionCommentProps(properties)（select.name.toLowerCase→normalize；Score/Reasons 防空）+ NOTION_STATUS_OPTION 映射表。
- 新建测试 `src/lib/__tests__/notionCommentMapper.test.ts`：Pending/Spam/Approved/select:null/属性缺失各态。
- 删 notion.ts 模块内 localComments/本地 helper，委托 @/data/comments。
- getCommentsByPostId：经 mapper 读三字段 + filterApprovedTree。
- ensureCommentsDbProps() 探测（缓存 hasStatus/hasScore/hasReasons）；addComment 三字段按探测门控写入（选项名经 NOTION_STATUS_OPTION），缺失 warn（含安全含义提示）；400 记录后回落本地。
- setCommentStatus：探测→update select（大写选项名）；400 重探测→ moderation-field-missing；本地兜底。
- getAllCommentsForAdmin：limit parseInt+clamp(1-100,缺省50)；hasStatus 时 select filter（大写选项名；tab + 3 次计数查询；capped 标注）；否则内存过滤；异常/无 Key → 本地层。
- 验证：tsc + 现有测试不回归。

## T7 站长邮件
- email.ts：escapeHtml；sendCommentModerationEmail(to, payload, locale)；无 key/无 to → console.log + skipped；内容含 status/score/reasons/文章链接(中英)/作者/摘要(200 字符截断+转义)/admin 链接；标签取 comments.notifyEmail。
- 测试：`<script>`/`<a href>` 被转义（可并入 T10 测试文件）。

## T8 评论 API
- route.ts：nodejs；POST：限流 429(rate_limited) → json().catch 400(invalid_input，email 正则/长度) → 频率计数 → 评分 → addComment → 通知(await+独立 try/catch) → 响应（approved 剥除 score/reasons 返回 comment；pending/spam 同构 moderation:'pending'；500 submit_failed）。GET approved-only。

## T9 后台 API
- `src/app/api/admin/comments/route.ts` GET：checkAdminAccess + getAllCommentsForAdmin。
- `src/app/api/admin/comments/status/route.ts` POST：checkAdminAccess + {id,status} 校验 + setCommentStatus（moderation-field-missing → 400 稳定码）。

## T10 i18n 文案
- en.json/zh.json 同步：comments.*（form/list/section/notifyEmail）、admin.comments.*（含 reasonLabels）。
- commentMessages.ts 新建；adminMessages.ts 扩 getAdminCommentsMessages。
- 验证：node 脚本 key 一一对应。

## T11 前端组件
- CommentForm/CommentList：硬编码 → commentMessages。
- CommentSection：POST body 带 locale；三态内联反馈替代 alert（approved 成功+refetch；pending 待审提示；429/失败可重试保留内容）；回复同构；不乐观插入。
- 验证：tsc/lint + grep 无硬编码。

## T12 审核工作台页面
- `src/app/admin/comments/page.tsx`：复用 /admin/content 模式（共用 admin_token/admin_locale）；三态 tab+计数徽标；score/reasons（reasonLabels 映射，查表前剥冒号后缀，未知码回落原值）；approve/spam/pending 操作后刷新；桌面表格+移动卡片；dark:；fieldMissingHint；列表 capped 时「仅显示最新 100 条」提示。
- 验证：tsc/lint/build。

## T13 路由层测试（TDD）
- `comments-route.test.ts`：vi.mock notion/email；三态落库/响应；spam 与 pending 同构且无 score/reasons；approved 响应无 score/reasons；429（唯一 IP 第 11 次）；400（畸形 JSON/非法）；邮件 throw 仍 200；同邮箱第 4 次 freq；zh body 选 zh 模板；GET approved-only。
- `admin-comments-route.test.ts`：鉴权三态（无 token 401/错 token 401/未配置 localhost 放行/未配置远程 403）；流转参数；moderation-field-missing → 400。
- 验证：npm test 全绿 total_tests>0。

## T14 门禁与验证
- lint/build/test 真实输出 → ci_result.md。
- 空 Key 起 dev（NOTION_API_KEY= RESEND_API_KEY= ADMIN_TOKEN=test-token npx next dev -p 4000），S1–S6 curl → deploy_report.md。
