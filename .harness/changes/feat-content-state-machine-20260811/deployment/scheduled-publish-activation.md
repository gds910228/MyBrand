# 定时发布激活指南（外部 cron 每分钟触发）

> 2026-08-17 用户反馈「设置定时时间后不会自动触发」排查结论与激活方案。
> 精度目标：**用户设几点，就（几乎）几点发**，最大延迟 ≈ 1 分钟。

## 根因（为什么之前不自动触发）

`/api/cron/publish` 是被动端点，自己不会醒来，线上靠调度器调用。
但当时阶段1决议 **D6** 选择「vercel.json 以 `.example` 提供，不替用户激活线上 cron」，
导致 `vercel.json` 从未创建 → Vercel 上没有注册任何 cron job → 没有任何东西调用该端点。
本地 dev 同理（Vercel Cron 只在 Vercel 平台运行）。

**与 Notion 时间字段的 UTC/UTC+8 无关** —— 到期比较逻辑
（`selectDueScheduledPosts`: `Date.parse(scheduledAt) <= now`）本身正确，
只是从未被执行。管理页「立即发布到期文章」按钮正常，正因为它手动调用了同一套逻辑。

## 方案：cron-job.org 外部触发（免费、精度 1 分钟、不依赖 Vercel 计划）

不使用 Vercel Cron（Hobby 计划限制每天 1 次，达不到分钟级；Pro $20/月不必要）。

### 步骤 1：Vercel 配置生产密钥

Settings → Environment Variables 新增（Production + Preview）：

```
CRON_SECRET=ab3fedd4ee83045151f9206dc4f35d6c226532239407178c07a416baa7c009f4
```

（随机生成于 2026-08-17，`openssl rand -hex 32`；可在 Vercel 部署日志外的任何地方轮换，
轮换时同步更新 cron-job.org 配置即可。）

### 步骤 2：cron-job.org 创建任务

1. 注册 cron-job.org（免费版即可支持每分钟）
2. Create Job：
   - **URL**: `https://<你的域名>/api/cron/publish`（部署域名，非 localhost）
   - **Schedule**: Every 1 minute
   - **Request method**: GET
   - **Headers**（Advanced 展开）: `Authorization: Bearer <CRON_SECRET>`
     - 推荐 Bearer 方式：secret 不出现在 URL 与访问日志中。
     - 等价简化：URL 直接带 `?secret=<CRON_SECRET>`（端点两种都支持），但会留在日志里。
   - **Timeout**: 30 seconds
   - **Notifications**: 开启失败邮件通知（端点故障时能及时发现）
3. Save

### 步骤 3：验证

1. 管理页 `/admin/content`：选一篇文章 → Status 设 `Scheduled` →
   「定时」设为 **2 分钟后**（浏览器本地时间，所见即所得）
2. 等待 ≤ 2 分钟，刷新管理页：
   - 文章变 `Published` ✅
   - cron-job.org 的 History 可看到每次执行的响应（200 + `{"ok":true,...}`）
3. 文章详情页与 /blog 列表可见（ISR 已由端点内 revalidateBlogPaths 刷新）

## 本地验证「自动触发」

本地没有调度器，用循环模拟（`dev:env` 实际端口 **3003**，以 start-dev.js 启动输出为准；Ctrl+C 停止）：

```bash
while true; do curl -s "http://localhost:3003/api/cron/publish?secret=dev-cron-secret-change-me"; echo; sleep 60; done
```

生产模式验证：`npm run build && npm start`（端口 3000）后把 URL 端口/secret 换成对应值。

## 端到端验证记录（2026-08-17，本地 dev + 真实 Notion）

- 现场物证：测试文章「Test Scheduled」status=scheduled、scheduledAt=2026-08-12T07:56Z（**已过期 5 天未发布** —— 正因无调度器触发）
- `GET /api/cron/publish?secret=<dev-cron-secret>` → `{"ok":true,"processed":1,"failed":0,"skipped":0,"details":[{"slug":"Scheduled","result":"published"}]}` ✅ **触发即发布**
- 复核 status=published ✅；随后已恢复 status=scheduled 且清除 scheduledAt（休眠态，未来 cron 会 skip，不会被误发）
- 错 secret → 401 ✅（鉴权路径正常）

## 时区说明（避免第二个坑）

| 设置途径 | 行为 |
|---|---|
| **管理页 datetime 选择器** | ✅ 浏览器本地时区，所见即所得（`page.tsx:142` 转 UTC ISO 存储） |
| Notion 直改 scheduledAt **选了时区**（如 UTC+8） | ✅ API 返回带 `+08:00` 后缀，正确解析 |
| Notion 直改 scheduledAt **不选时区** | ⚠️ 无时区字符串被服务器按 UTC 解析（Vercel=UTC），北京时间会被推迟 8 小时 |

**结论：一律从管理页设置时间即可。**

## 负载评估

cron 每分钟 1 次 → `listScheduledPostsRaw` 全量查 Notion 一次（`queryAllBlogPages` 无缓存，
<100 篇时 1 个请求）。Notion 限制平均 3 req/s，余量充足，无需改缓存。
