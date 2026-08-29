# Spec：评论系统治理（反垃圾评分 + 审核状态机 + 站长通知）

- 变更 ID：feat-comment-moderation-20260828
- 日期：2026-08-28
- 版本：**v2**（按 spec_review_v1 的 5 P1 + 10 P2 修订；修订点见文末「v2 修订记录」）
- 模式：单次执行，HITL 点不暂停（决策见 summary.md「HITL 决策记录」）

---

## 1. 功能描述

### 1.0 现状（阶段 1 实读代码核实，非臆断）

- `src/app/api/comments/route.ts`：GET `?postId=` 直调 `getCommentsByPostId`；POST 仅校验 `postId/author.name/author.email/content` 非空，**无限流、无评分、无状态、无通知**。错误文案硬编码英文。
- `src/services/notion.ts`：
  - `CommentType`（L38-50）：id/postId/parentId/author{name,email,avatar?}/content/createdAt/replies?，**无状态字段**。
  - Notion 评论库实际读写属性：`AuthorName`(rich_text)、`AuthorEmail`(email)、`AuthorAvatar`(url)、`Content`(rich_text)、`CreatedAt`(date)、`PostId`(rich_text)、`ParentId`(rich_text)。
  - `getCommentsByPostId`（L1258）：Notion query `PostId equals` → map → 内存建树；**无状态过滤**；异常/未配置 Key → `getLocalCommentsByPostId`（模块内 `localComments` 种子 L110-147）。
  - `addComment`（L1327）：Notion `pages.create`；异常/未配置 → `addLocalComment`（push 进扁平 `localComments`，`buildCommentTree` L1456 建树；**该建树函数直接 mutate 种子对象，重复 GET 会重复挂回复——既有 bug，v2 由非变异纯函数取代**）。
- `src/data/comments.ts`：第二份 CommentType + **预嵌套**种子数据 + getCommentsByPostId/addComment/addReply；grep 确认**零 import（死代码）**。架构上 `src/data/` 本就是「本地兜底层」（工程结构规则）。
- 可复用设施（已实读）：
  - `src/lib/rateLimit.ts`：`getClientIp(request)` + `rateLimited(ip)`，内存 10 次/分/IP。
  - `src/services/email.ts`：Resend 封装；无 `RESEND_API_KEY` 时 `resend=null`，降级 `console.log` 返回 `{ ok:false, skipped:true }`；现有模板只插值 Notion 文章数据。
  - `src/lib/adminAuth.ts`：`evaluateAdminAccess`（纯）+ `checkAdminAccess(request, bodyToken?)`（Bearer 优先；只读 Host 头；未配置 token 仅 localhost 放行 + warn）。
  - `/admin/content` 页 + `/api/admin/content/route.ts`：checkAdminAccess 模式；client 页 sessionStorage `admin_token`、静态 JSON i18n、桌面表格+移动卡片、dark:。
  - `src/lib/adminMessages.ts` / `subscribeMessages.ts`：项目未挂 NextIntlClientProvider，client i18n 既定模式 = 静态 import en/zh JSON 按 locale 取。
  - vitest：node 环境、`@` alias、`src/**/*.test.ts`，现有 4 个测试文件真实跑通。

### 1.1 反垃圾评分引擎 `src/lib/spamScore.ts`（新建，纯函数）

**输入**：
```ts
interface SpamScoreInput {
  author: { name: string; email: string };
  content: string;
  /** 频率规则：同一邮箱统计窗口内近期提交数（调用方注入；纯函数不接触时钟/Map） */
  recentCountForEmail?: number;
}
interface SpamRuleConfig {
  thresholds: { spam: number; pending: number };        // 默认 { spam: 70, pending: 30 }
  keywordBlocklistEn: string[];
  keywordBlocklistZh: string[];
  suspiciousTlds: string[];                             // ['.xyz','.top','.click','.win','.loan','.work','.date','.review','.country','.stream','.gq','.tk', …]
  disposableEmailDomains: string[];                    // ['mailinator.com','tempmail.com','10minutemail.com','guerrillamail.com', …]
  weights: Record<string, number>;                      // 全部权重可覆盖
  minMeaningfulLength: number;                          // 默认 4
}
```
**输出**：`{ score: number(0-100), reasons: string[] }`。reasons 为稳定机器码（见下），**不含用户输入原文**（防日志/邮件注入）。

**语义钉死（v2 P2-1）**：
- 「链接」= 正则 `(https?:\/\/|www\.)[^\s<>"']+`（要求 scheme 或 www. 前缀；裸域名不算）。可疑链接：URL 的 host 命中可疑 TLD、或 host 为 IP 字面量。可疑链接**同时**计入链接数量。另有独立扫描 `[a-z][a-z0-9+.-]*:\/\/[^\s<>"']+`（v2 评审 P2-v2-2：非 http(s) scheme 如 `ftp://`、`javascript:` 不被链接正则命中，单独喂给可疑规则）：命中非 http/https scheme 的 URL → 每条 +25（reason `suspicious_link:{n}`），不计入链接数量。
- 关键词匹配：en 词表大小写不敏感（双方 lowercase，子串匹配短语）；zh 词表子串匹配。每个**不同**命中词计一次。
- 全大写规则：拉丁字母总数 < 8 时跳过（纯中文评论零误伤）；否则「连续 ≥3 个大写字母 run 中的字母数 / 拉丁字母总数」> 60% 且正文 >15 字符命中。
- reason 码表：`links:{n}`、`suspicious_link:{n}`、`link_density`、`keyword:{词}`（词为配置词表原文，非用户输入）、`caps`、`repeat_chars`、`repeat_lines`、`too_short`、`email_tld:{tld}`、`email_domain:{domain}`、`freq:{n}`。

**决策函数**（同文件，纯）：`decideModeration(score, thresholds?): 'approved'|'pending'|'spam'`
- `< pending(30)` → approved；`30–69` → pending；`>= spam(70)` → spam。
- 边界钉死：29→approved、30→pending、69→pending、70→spam（单测）。

**纯函数纪律**：不读 `Date.now()`、不读网络、不读写模块级可变状态；频率由参数注入；默认配置为模块常量。

### 1.2 规则与权重（依据随附；总分 cap 100）

| 规则 | 权重 | 依据 |
|---|---|---|
| 链接数量 | `min(45, 15 × 链接数)` | 链接是评论垃圾最强特征之一；≥3 条=45（单特征进 pending），叠加一个黑名单词即 ≥70 spam |
| 可疑链接 | 每条 +25 | 合法评论极少贴可疑 TLD/IP 链接；1 条 = 15+25 = 40 → pending（S3） |
| 链接占比 | 链接字符/正文 > 50% 且正文 ≥20 字符 → +15 | 整段几乎全 URL 的典型 spam |
| 黑名单关键词 | 每个不同命中 +30，cap 50（en/zh 双语可配置；默认偏高精度短语：viagra/casino/payday loan/free money/get rich quick/airdrop giveaway/…；刷单/赌场/博彩/代开发票/信用卡套现/加微信送/日赚/棋牌/彩票/…） | 高精度但有误伤，单词命中 30 分进 pending 人工复核而非直接 spam |
| 全大写 | +20（语义见 1.1） | shouting 弱信号 |
| 连续重复字符 | 同字符连续 ≥5 → +10 | 弱信号 |
| 重复行 | 去空白后相同非空行 ≥3 次 → +25 | 灌水强信号 |
| 内容过短 | 去空白标点后长度 < 4 → +20 | 「1」「asdf」类 |
| 可疑邮箱 | 域名命中 disposable 列表 → +25（`email_domain:`）；TLD 命中可疑表 → +25（`email_tld:`） | 一次性邮箱/可疑 TLD 高频 spam |
| 同邮箱高频 | `recentCountForEmail >= 5` → +50；`>= 3` → +40（窗口 10 分钟，路由侧注入） | 刷量强信号 |

校准核对：正常评论 0 → approved（S1）；≥3 链接(45)+黑名单词(30)=75 → spam（S2）；1 可疑链接 40（密度再加也仅 55）→ pending（S3）；单词命中 30 → pending；freq(40)+keyword(30)=70 spam。

### 1.3 类型与本地兜底层（v2 按 P1-1 统一双份 fallback）

- **新建 `src/types/comment.ts`**（跨层共享类型，工程结构规则）：
  - `CommentStatus = 'pending'|'approved'|'spam'`；
  - `CommentType`：现有字段 + 可选 `status?`、`spamScore?`、`spamReasons?: string[]`；
  - `AdminCommentItem`（钉死形状，P2-10）：`{ id, postId, parentId: string|null, author: {name,email,avatar?}, content, createdAt, status: CommentStatus, spamScore: number|null, spamReasons: string[] }`；
  - `ModerationResult = { score: number; reasons: string[]; decision: CommentStatus }`。
  - `notion.ts` 改为 `export type { ... } from '@/types/comment'` re-export（现有 `import type { CommentType } from '@/services/notion'` 全部兼容，零组件改动）。
- **`src/data/comments.ts` 改造为唯一本地兜底层（活代码）**：
  - 删掉重复 CommentType，从 `@/types/comment` 引入；
  - 种子数据改**扁平数组**（3 条种子，不含 status 字段——用于证明旧数据兜底；其 id 保持 comment-1/2/3）；
  - 导出：`getLocalCommentsByPostId(postId)`（`filterApprovedTree(flat)`）、`addLocalComment(payload)`（写 status/score/reasons，push 扁平 store）、`setLocalCommentStatus(id, status)`（扁平 store 递归查找更新，返回 boolean）、`getAllLocalCommentsForAdmin({status?, limit?})`（扁平 + 三态计数 counts，按 createdAt desc）、`resetLocalCommentsForTest()`（仅测试用，恢复种子）；
  - 建树/过滤全部调 `src/lib/commentTree.ts` 纯函数，不再自行嵌套。
- **新建 `src/lib/commentTree.ts`（纯函数，非变异，v2 P2-5）**：
  - `normalizeCommentStatus(raw?: string): CommentStatus`——仅 `'pending'|'spam'` 原样返回，其余（undefined/空/非法/`'approved'`）一律 `'approved'`；
  - `buildCommentTree(flat)`：**构建全新对象/数组，绝不 mutate 输入**；parentId 找不到父的孤儿丢弃；
  - `filterApprovedTree(flat)`：先 filter `normalizeCommentStatus === 'approved'` 再 buildCommentTree。效果：pending/spam 顶级不出现、pending/spam 回复不出现、挂在隐藏父评论下的回复成孤儿不出现；
  - 幂等：同一输入双次调用输出完全相同（单测钉死，顺带修掉现有重复挂回复 bug）。
- **`src/services/notion.ts` 改造**：
  - 删除模块内 `localComments` 种子与 `getLocalCommentsByPostId/addLocalComment/buildCommentTree`，改从 `@/data/comments` 引入本地实现（fallback 单一数据源）；
  - **Notion 字段映射纯函数（v2 评审 P1-v2-1，必须抽纯函数并单测）**：新建 `src/lib/notionCommentMapper.ts`，导出 `mapNotionCommentProps(properties: any): { status: CommentStatus; spamScore: number|null; spamReasons: string[] }`——读 `ModerationStatus?.select?.name` 后**先 `.toLowerCase()` 再 normalizeCommentStatus**（Notion 选项名是大写 `Pending/Approved/Spam`；直接 normalize 会把 Pending 误兜底成 approved，导致审核反转）；`SpamScore?.number ?? null`；`SpamReasons?.rich_text` plain_text 逗号 split（空→[]）；属性缺失全程可选链防空。配套导出 `NOTION_STATUS_OPTION: Record<CommentStatus,string> = { pending:'Pending', approved:'Approved', spam:'Spam' }` 写入选型表。单测：`{select:{name:'Pending'}}`→pending、`{select:null}`/属性缺失→approved、`Spam`→spam、`Approved`→approved。
  - `getCommentsByPostId`：Notion 路径 map 时经 `mapNotionCommentProps` 读三字段；然后 `filterApprovedTree`；catch/未配置 → 本地层；
  - `addComment`：payload 接受 status/spamScore/spamReasons；
  - **字段探测（v2 P2-3/P2-4）**：`ensureCommentsDbProps()` 按需 `databases.retrieve` 探测评论库，缓存结果 `{ hasStatus, hasScore, hasReasons }`（未配置 Key 或探测失败 → 全 false）。写入时：三字段**分别**按探测结果门控拼入 properties——`ModerationStatus` 用 `NOTION_STATUS_OPTION`（大写选项名 `Pending/Approved/Spam`，小写写入会被 Notion 静默新建重复选项）、`SpamScore` number、`SpamReasons` rich_text；任一缺失 → `console.warn` 明确提示「Notion 评论库缺字段，该路径审核不生效（spam 默认可见），请按 spec §3 加字段」。Notion 400 validation 错误不静默吞为普通失败：记录后回落本地（评论不丢）；
  - 新增 `setCommentStatus(id, status)`：先 `ensureCommentsDbProps()`；`hasStatus` 为 false → 返回 `{ ok:false, error:'moderation-field-missing' }`；`pages.update` 写 `ModerationStatus` select（选项名经 `NOTION_STATUS_OPTION` 映射），若 400 且错误点名属性 → 重新探测一次再返回该稳定错误码；成功返回 `{ ok:true }`；未配置 Key/异常 → `setLocalCommentStatus` 兜底；
  - 新增 `getAllCommentsForAdmin({status='all', limit=50})`（v2 P1-2 + v2 评审 P2-v2-1/P2-v2-3）：limit 解析为 int 并 clamp 到 1–100（垃圾值/缺省 → 50）。`ensureCommentsDbProps()`：
    - `hasStatus` 为 true：列表按 status 用 Notion **select filter** 查询，filter 值用 `NOTION_STATUS_OPTION[status]`（大写选项名；小写会查到 0 行）——pending/spam tab 不再受窗口限制；all 时不加 filter，page_size=limit 按 CreatedAt desc，**响应标注 `capped:true` 供 UI 提示「仅显示最新 100 条」**；counts 用 3 次 select filter 查询（page_size=100，同样大写选项名）取 results.length（大库计数为上限值，UI 注明 100+）；
    - `hasStatus` 为 false：内存过滤（所有行兜底 approved，无 pending 可漏）；
    - 异常/未配置 Key → `getAllLocalCommentsForAdmin`（计数精确）。

### 1.4 API 改造 `src/app/api/comments/route.ts`

`export const runtime = 'nodejs'`。POST 流水线（顺序固定）：
1. `getClientIp` + `rateLimited(ip)` → 超限 **429** `{ ok:false, code:'rate_limited', error:'Too many requests' }`。
2. body 解析：`await request.json().catch(() => null)`，null/非对象 → **400** `{ ok:false, code:'invalid_input', ... }`（v2 P2-2，畸形 JSON 不进 500）。校验：postId/author.name/author.email/content 必填且为字符串、email 正则、name ≤80 字符、content trim 后 1–2000 字符；`locale` 取 `'zh'|'en'`（默认 en）；`parentId` 可选字符串。非法 → 400 code:invalid_input。
3. 频率：`recentCountForEmail(email)`（`src/lib/commentFrequency.ts`，仿 rateLimit 内存 Map，窗口 10 分钟；提交后 `recordSubmission`；导出 `resetCommentFrequencyForTest()`）。
4. `scoreComment()` → `decideModeration()`。
5. `addComment({...字段, status, spamScore, spamReasons})` 落库；服务层内部决定 Notion/本地。
6. 通知（1.5）：pending/spam 触发。**`await` 于独立 try/catch 内**（v2 P2-9 钉死：await 保证 serverless 日志落盘；失败仅 console.error，绝不影响响应码/响应体）。
7. 响应：
   - approved → **200** `{ ok:true, moderation:'approved', comment }`，comment **剥除 spamScore/spamReasons**（v2 P2-6，status 保留无害）；
   - pending → **200** `{ ok:true, moderation:'pending' }`；
   - spam → **200** `{ ok:true, moderation:'pending' }`（与 pending **字节同构**，HITL-1a：防差分探测；score/reasons 绝不出现在任何前台响应）；
   - 落库异常 → **500** `{ ok:false, code:'submit_failed', error:'Failed to add comment' }`，console.error 不裸抛。
- GET：签名不变 `{ comments }`，内容仅 approved（树已过滤）；异常 500。

### 1.5 站长通知

- `src/services/email.ts` 新增 `sendCommentModerationEmail(to, payload, locale)`：复用 `resend`/`FROM`/`SITE_URL` 与降级模式；无 `RESEND_API_KEY` 或无 `to` → `console.log` 完整信息 + `{ ok:false, skipped:true }`。
- **HTML 转义（v2 P1-3）**：author.name、author.email、content 摘要（截断 200 字符）插值前一律 `escapeHtml`（`& < > " '`）；URL 只由 postId/SITE_URL 配置构造（postId 做 encodeURIComponent）；单测断言 `<script>`/`<a href>` 被转义。
- 内容（站长可见）：状态、score、reasons（原始码）、文章 slug + 前台链接（`/blog/{slug}` 与 `/zh/blog/{slug}` 都列）、作者 name/email、内容摘要、审阅链接 `${SITE_URL}/admin/comments`。
- 收件人 `COMMENT_NOTIFY_TO`（未配置 → skipped 降级）。标签文案走 `comments.notifyEmail.*`（en/zh，按提交 locale）。

### 1.6 审核工作台 `/admin/comments`（新建页面 + API）

- API（全部 `checkAdminAccess`；nodejs runtime）：
  - `GET /api/admin/comments?status=all|pending|spam|approved&limit=` → `{ items: AdminCommentItem[], counts }`；
  - `POST /api/admin/comments/status` body `{ id, status }`：校验 → `setCommentStatus`；`moderation-field-missing` → **400** `{ ok:false, code:'moderation-field-missing' }`（前端提示加字段）；鉴权 401/403；其它 500。
- 页面 `src/app/admin/comments/page.tsx`（client，复用 /admin/content 模式）：
  - token 登录（sessionStorage `admin_token` 与 content 后台共用）；页内 EN/中 切换（localStorage `admin_locale` 共用）；
  - 三态 tab（全部/待审/垃圾/已通过）+ 待审、垃圾**计数徽标**；每条显示作者 name/email、内容、postId、时间、状态、**score 与 reasons**；
  - reason 展示：`admin.comments.reasonLabels` 映射已知码（i18n）；查表前**先剥离冒号后缀**（`links:3`→`links`、`keyword:casino`→`keyword`、`email_tld:.xyz`→`email_tld`、`freq:4`→`freq`，v2 评审 P2-v2-3）；未知码回落显示原始码；
  - 操作：通过 / 标垃圾 / 打回待审（按钮组）；操作后自动刷新；approve 后前台 GET 立即可见；
  - 桌面表格 + 移动卡片；`dark:`；无硬编码文案。
- i18n helper：`src/lib/adminMessages.ts` 增 `getAdminCommentsMessages(locale)`。

### 1.7 前端组件改造（CommentSection / CommentList / CommentForm）

- 新建 `src/lib/commentMessages.ts`（仿 subscribeMessages）：`getCommentMessages(locale)` 读 `messages.comments`。
- 三组件现有硬编码中英三元全部替换为 messages。
- **POST body 带 `locale`（v2 P1-5）**：评论与回复都带（组件已有 locale prop）。
- CommentSection 提交后按 `moderation` 分流（内联状态条替代 `alert`）：
  - approved：成功提示 + refetch（服务端 approved 列表驱动，**不做乐观插入**——被审评论不占位不闪烁）；
  - pending（spam 同构）：「已提交，待站长审核后显示」；
  - 429：限流提示 + 可重试（表单内容保留、按钮恢复）；
  - 其它：失败提示 + 可重试。
- 列表仅渲染服务端 approved 树。

### 1.8 i18n 新增 key（en.json / zh.json 同步，结构对齐）

- 顶层 `comments`：form（name/email/content/占位/校验/submit/submitting/cancel/replySubmit）、list（reply/empty）、section（title/count/leaveComment/replyTo/loading/loadFailed/successApproved/successPending/rateLimited/submitFailed/retry）、notifyEmail（subject/greeting/labels: post/author/email/content/status/score/reasons/reviewLink/…）。
- `admin.comments`：title/loginTitle/passwordPlaceholder/login/logout/refresh/tabs(all/pending/spam/approved)/counts 后缀/列名/actions(approve/markSpam/toPending)/status 名/score/reasons/empty/loading/loadFailed/actionFailed/fieldMissingHint/langEn/langZh/reasonLabels（links/suspicious_link/link_density/keyword/caps/repeat_chars/repeat_lines/too_short/email_tld/email_domain/freq）。

---

## 2. 影响页面（EN/ZH 双套）

| 页面/路由 | EN | ZH | 影响 |
|---|---|---|---|
| 博客详情评论区 | `/blog/[slug]`（CommentSection locale="en"） | `/zh/blog/[slug]`（locale="zh"） | 三态反馈、approved-only 列表；组件共用 |
| 评论 API | `/api/comments` GET/POST | 同（locale 由 body） | 限流/评分/状态/通知 |
| 审核后台 | `/admin/comments`（新建，页内 EN/中切换） | 同 | 新建 |
| 审核 API | `/api/admin/comments` GET、`/status` POST | 同 | 新建 |
| 站长邮件 | 标签 en/zh 两套（按提交 locale） | — | 新建 |
| 无变更 | 首页/项目/关于/联系/订阅/搜索/询价 | — | 不动 |

双语验证（云端无浏览器）：① 脚本比对 en/zh key 一一对应；② grep + 走查无硬编码中英；③ build 成功 + API curl 等价替代；UI 交互由用户本地浏览器补验。

---

## 3. Notion 评论库需手动新增字段（HITL-1，站长操作）

| 字段名（精确） | 类型 | 选项/格式 | 说明 |
|---|---|---|---|
| `ModerationStatus` | Select | `Pending` / `Approved` / `Spam` | 审核状态。不设默认值；旧行无此属性 → 代码兜底 approved |
| `SpamScore` | Number | 整数 0–100 | 反垃圾评分 |
| `SpamReasons` | Text（rich_text） | 逗号分隔原因码 | 命中规则（站长可见） |

防空策略：读——属性缺失/为空 → status 兜底 approved；写——三字段分别探测门控，缺失则写旧 schema + 醒目 console.warn（**字段建好前 Notion 路径审核不生效、spam 默认可见**；本地 fallback 三态完整）；setCommentStatus 字段缺失 → 稳定错误码 `moderation-field-missing`，后台提示站长加字段。

---

## 4. 新增/依赖环境变量

| 变量 | 必需 | 未配置行为 |
|---|---|---|
| `COMMENT_NOTIFY_TO` | 否 | 不发邮件，console.log 完整通知内容（skipped） |
| `ADMIN_TOKEN` | 已有复用 | 配置则必须 Bearer 匹配；未配置仅 localhost + warn |
| `RESEND_API_KEY` / `RESEND_FROM` | 已有复用 | 无 key 降级 console.log |
| `NOTION_API_KEY` / `NOTION_COMMENTS_DATABASE_ID` | 已有复用 | 无 key 走本地兜底层（三态完整） |

---

## 5. 验收标准

### 5.1 功能验收
1. spamScore：正常评论 0 分；各规则独立命中正分 + reason 码；29/30/69/70 边界 approved/pending/pending/spam；阈值/词表/权重可注入；频率只经入参生效（函数内无时钟/共享状态）；纯中文评论不触发 caps 规则。
2. 前台 GET：只出 approved；pending/spam 顶级与回复均不可见；隐藏父评论下的回复不可见；Notion 路径与本地兜底层（**统一后 src/data/comments.ts 为唯一本地源**）口径一致；旧数据无状态字段全部兜底 approved；双次 GET 回复不重复（幂等）。
3. POST：第 11 次/分/IP → 429；三态落库（status/score/reasons 写入）；spam 响应与 pending 字节同构且**不含** score/reasons/字段名；approved 响应 comment 不含 spamScore/spamReasons；畸形 JSON/非法输入 → 400；异常 → 500 + console.error。
4. 通知：pending/spam 触发邮件（含文章/作者/摘要/score/reasons/后台链接）；用户输入字段经 HTML 转义；无 COMMENT_NOTIFY_TO/RESEND_API_KEY → console.log 降级；邮件发送 throw 不影响 POST 200。
5. 后台：三态 tab + 计数徽标（pending/spam 走 Notion select filter，不被 100 行窗口漏掉）+ score/reasons 展示 + 流转；鉴权：正确 token 放行、错/缺 token 401、未配置 token 时远程 403/localhost 放行；字段缺失返回 moderation-field-missing 并提示；approve 后前台立即可见。
6. 前端：三态反馈全 i18n（en/zh key 对齐），无硬编码；限流/失败可重试且保留内容；被审评论不占位不闪烁；POST body 带 locale。

### 5.2 场景矩阵（阶段 9 curl，空 Key 态，端口 4000）
- S1 自然语言无链接 → approved → GET 立即可见。
- S2 ≥3 链接 + 黑名单词 → spam → GET 不可见；响应体无 score/reasons。
- S3 单一可疑特征（1 可疑链接）→ pending → GET 不可见；响应提示待审核。
- S4 同 IP 第 11 条 → 429。
- S5 对 S1 评论发 pending/spam 回复 → GET 树中不出现。
- S6 后台：S3 pending approve（错 token 401、正确 token 200）→ GET 出现。

### 5.3 门禁与单测（vitest A 路径，npm test 真实通过 total_tests>0）
- a) `spamScore.test.ts`：各规则独立命中正分、正常 <30、边界 29/30/69/70、配置注入、频率注入、中英词表、caps 纯中文跳过。
- b) `commentTree.test.ts` + `comments-data.test.ts`：normalize 兜底；filterApprovedTree 三路径；幂等双次调用；**本地兜底层**（src/data/comments.ts）隐藏 pending/spam 顶级与回复、隐藏父下回复、无状态种子可见、setLocalCommentStatus 翻转可见性、admin 计数；每用例唯一 postId + reset。
- b2) `notionCommentMapper.test.ts`（v2 评审 P1-v2-1）：`{select:{name:'Pending'}}`→pending、`{select:null}`/属性缺失→approved、`Spam`→spam、`Approved`→approved；SpamScore/SpamReasons 防空解析；NOTION_STATUS_OPTION 表完整。
- c) `comments-route.test.ts`：vi.mock notion/email；POST 三态落库与响应语义；spam 响应不含 score/reasons（approved 响应也不含）；429（第 11 次，唯一 IP）；400（畸形 JSON/非法输入）；**邮件 send throw 时 POST 仍 200**；同邮箱第 4 次 freq 加分；zh body 选 zh 邮件模板；GET 仅 approved。
- d) `admin-comments-route.test.ts`：鉴权三态（无 token 401/错 token 401/未配置+localhost 放行/未配置+远程 403）；流转调用参数；moderation-field-missing → 400。
- e) `email-escaping`（可并入 route 或 email 测试）：含 `<script>`/`<a href>` 的内容在邮件 HTML 中被转义。
- 门禁：`npm run lint` exit 0、`npm run build` 成功、`npm test` 全绿。

---

## 6. 文件清单

**新建**：`src/types/comment.ts`、`src/lib/spamScore.ts`、`src/lib/commentTree.ts`、`src/lib/notionCommentMapper.ts`、`src/lib/commentFrequency.ts`、`src/lib/commentMessages.ts`、`src/app/api/admin/comments/route.ts`、`src/app/api/admin/comments/status/route.ts`、`src/app/admin/comments/page.tsx`、测试 6 份（spamScore/commentTree/notionCommentMapper/comments-data/comments-route/admin-comments-route）。

**修改**：`src/services/notion.ts`（类型 re-export；本地 fallback 委托 data 层；三字段读写+探测门控；setCommentStatus；getAllCommentsForAdmin）、`src/app/api/comments/route.ts`（流水线）、`src/services/email.ts`（sendCommentModerationEmail + escapeHtml）、`src/components/CommentSection.tsx`/`CommentList.tsx`/`CommentForm.tsx`（i18n + 三态反馈 + locale body）、`src/lib/adminMessages.ts`（admin.comments）、`src/i18n/messages/en.json`/`zh.json`、`src/data/comments.ts`（改造为唯一本地兜底层，活代码）。

**不改**：middleware、订阅/推送/内容状态机/询价/搜索等既有功能。

---

## 7. v2 修订记录（对 spec_review_v1）

- P1-1：双份 fallback → **统一为 src/data/comments.ts 唯一本地兜底层**（活代码，notion.ts 委托），测试直接覆盖；消除重复类型/种子/建树逻辑。
- P1-2：admin 列表/计数在字段存在时改 Notion select filter，pending/spam 不受窗口限制。
- P1-3：邮件用户输入字段 HTML 转义 + 专项测试。
- P1-4：新增 comments-data.test.ts 直接测本地兜底层 + notion 接线由路由测试与走查覆盖；reset 导出。
- P1-5：前端 POST body 带 locale + zh 模板测试。
- P2-1：链接定义/大小写不敏感/caps 拉丁字母<8 跳过/email_domain 码全部钉死。
- P2-2：畸形 JSON → 400（json().catch）。
- P2-3：三字段分别探测门控写入 + warn 醒目提示安全含义。
- P2-4：setCommentStatus 按需探测 + 400 后重探测。
- P2-5：commentTree 非变异 + 幂等测试（修重复挂回复既有 bug）。
- P2-6：approved 响应剥除 score/reasons。
- P2-7：reasonLabels i18n 映射 + 未知码回落。
- P2-8：补邮件 throw 不阻塞、freq 端到端测试；frequency 导出 reset。
- P2-9：通知 await+try/catch 选择钉死。
- P2-10：AdminCommentItem 形状钉死（含作者邮箱）。

### v2.1 修订（spec_review_v2 轮，复审发现）

- **P1-v2-1（Notion 选项名大小写）**：抽出 `src/lib/notionCommentMapper.ts` 纯函数；读路径 `select.name.toLowerCase()` 后再 normalize（防 Pending 被误兜底 approved 导致审核反转）；写路径与 select filter 一律经 `NOTION_STATUS_OPTION` 映射大写选项名（防小写写入静默新建重复选项 / filter 查 0 行）；新增 notionCommentMapper 单测。
- P2-v2-1：admin 列表 all/tab 查询 capped 标注 `capped:true`，UI 提示「仅显示最新 100 条」。
- P2-v2-2：非 http(s) scheme（ftp://、javascript:）独立扫描喂可疑规则，链接数量规则不计数；消除不可达条款。
- P2-v2-3：limit 参数 parseInt + clamp 1–100（缺省/垃圾值 50）；reasonLabels 查表前剥离冒号后缀。
