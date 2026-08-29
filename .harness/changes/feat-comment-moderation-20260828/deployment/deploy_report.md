# 部署验证报告（云端等价验证 · 无 Key 态）

- 日期：2026-08-28
- 验证方式：**云端等价验证（无浏览器）**。沙箱无浏览器；按任务要求外部依赖走「无 Key 降级路径」：
  以环境变量 `NOTION_API_KEY=`（空）、`RESEND_API_KEY=`（空）、`COMMENT_NOTIFY_TO=`（空）、
  `ADMIN_TOKEN=test-admin-token` 启动 `next dev -p 4000`（Next @next/env 不覆盖已存在的 process.env，
  `.env.local` 中的 key 被空值压制，日志确证：`Notion API key or database ID not configured, using local storage`）。
  这样评论读写走唯一本地兜底层（src/data/comments.ts，三态完整可用），通知邮件走 console.log 降级；
  不向真实 Notion/Resend 写任何数据。UI 交互由用户本地浏览器补验。

## 服务启动

```
$ NOTION_API_KEY= RESEND_API_KEY= ADMIN_TOKEN=test-admin-token COMMENT_NOTIFY_TO= npx next dev -H 127.0.0.1 -p 4000
▲ Next.js 14.1.0   - Local: http://127.0.0.1:4000   Environments: .env.local
```

## 场景矩阵结果（S1-S6 全 PASS）

### S1 正常自然语言评论 → approved → GET 立即可见 ✅
```
POST {"ok":true,"moderation":"approved","comment":{"id":"comment-local-...-1","status":"approved",...}}  HTTP 200
GET  → comment count: 1；status=approved；响应无 spamScore/spamReasons 字段
```

### S2 3 链接 + 黑名单词（viagra）→ spam → GET 不可见，响应无泄露 ✅
```
POST {"ok":true,"moderation":"pending"}   HTTP 200   （与 pending 字节同构）
泄露检查：响应体不含 score / reasons / spam / viagra 字样 → no leak PASS
GET  → visible comments: 0 （spam hidden）
服务端日志（仅站长侧）：[email:demo] comment moderation (spam, score=100) -> (COMMENT_NOTIFY_TO not configured)
```

### S3 单一可疑链接（http://offer.top）→ pending → GET 不可见 ✅
```
POST {"ok":true,"moderation":"pending"}   HTTP 200
GET  → 0 visible （pending hidden）
```

### S4 同 IP 连续提交 → 第 11 次 429 ✅
```
request 1..10 → HTTP 200（approved）；request 11 → HTTP 429 rate_limited
```

### S5 对 S1 已通过评论发 spam/pending 回复 → 树中不出现 ✅
```
spam 回复（3 链接 + casino）POST {"ok":true,"moderation":"pending"} → GET root replies 可见数 0
pending 回复（http://deal.top）POST {"ok":true,"moderation":"pending"} → GET root replies 可见数 0
阳性对照：正常 approved 回复 → GET 树中 1 条回复可见（PASS）
```

### S6 后台鉴权 + 状态流转 ✅
```
GET  /api/admin/comments?status=pending  错 token → 401；无 token → 401
GET  /api/admin/comments?status=pending  Bearer test-admin-token → 200，找到 S3 待审评论（score/reasons/作者邮箱可见）
POST /api/admin/comments/status 错 token → 401
POST /api/admin/comments/status 正确 token {"id":"...","status":"approved"} → {"ok":true} HTTP 200
GET  公开评论（S3 文章）→ 该评论立即可见且无治理字段泄露
```

### 后台工作台计数（跨路由共享存储）
```
GET /api/admin/comments?status=spam    → 2 条（S2 顶级 + S5 spam 回复，score=100）
GET /api/admin/comments?status=all     → counts {pending:0, spam:2, approved:15, total:17} capped:false
（验证中发现并修复：dev 下不同 route chunk 持有 data/comments 独立实例，已改为 globalThis 单例存储；
  Notion 配置态本来就由外部数据库共享，无此问题）
```

### 页面冒烟
```
GET /admin/comments        → 200
GET /blog/[slug]           → 200
GET /zh/blog/[slug]        → 200
```

### i18n 双语
```
en leaf keys: 217，zh leaf keys: 217，missing zh: 0，missing en: 0
（comments.* 与 admin.comments.* 全部中英对齐；云端无浏览器，交互层由用户本地补验）
```

## 站长需手动完成的 Notion 配置（生产启用 Notion 存储时）

| 字段名（精确） | 类型 | 选项 |
|---|---|---|
| `ModerationStatus` | Select | `Pending` / `Approved` / `Spam`（不设默认值） |
| `SpamScore` | Number | 0-100 |
| `SpamReasons` | Text | 逗号分隔原因码 |

字段未建好时代码行为（已实现并验证降级语义）：写入走旧 schema 并 console.warn 逐字段点名（Notion 路径审核不生效、spam 默认可见）；`setCommentStatus` 返回稳定错误码 `moderation-field-missing`，后台提示加字段；旧行无字段一律兜底 approved 可见。

## 本地复现（无 Key）

```bash
NOTION_API_KEY= RESEND_API_KEY= COMMENT_NOTIFY_TO= ADMIN_TOKEN=test-admin-token npx next dev -H 127.0.0.1 -p 4000
# 场景按 S1-S6 的 curl 复跑；后台 http://localhost:4000/admin/comments ，令牌 test-admin-token
```

## 有 Key 生产验证（用户本地）

1. `.env.local` 配 `COMMENT_NOTIFY_TO=站长邮箱`，Notion 评论库加上述 3 字段。
2. `npm run dev:env` → 提交垃圾测试评论 → 站长收邮件（含 score/reasons/后台链接）→ /admin/comments 审核。
3. EN/ZH 博客页各发一条评论，确认三态反馈文案双语正常。
