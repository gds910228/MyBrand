# Spec - 邮件订阅 + 新文章 Web Push 推送

## 1. 功能描述

为 MisoTech 站点新增「订阅 + 新文章通知」系统,复用 Notion 作为存储,实现两条订阅通道:

- **邮件订阅(double opt-in)**:用户提交邮箱 -> Resend 发确认邮件 -> 点击确认链接 -> Notion 中 status 置 active。
- **Web Push 订阅(VAPID)**:浏览器授权 -> 注册 push 订阅 -> 落库 pushSubscription -> 新文章发布时推送通知。

**触发点**:改造现有 `/api/revalidate` 路由,新增 `?notify=<slug>` 参数。revalidate 完成后,对 active 订阅者发 Web Push + 邮件,单订阅失败隔离并重试一次,返回成功/失败计数。

**降级原则(关键)**:无 `RESEND_API_KEY` / 无 VAPID Key 时,仅落库并在服务端控制台打印「将要发送的内容」,保证本地无密钥也能 `npm run dev:env` 跑起来验证。

## 2. 影响面(EN/ZH 双语)

| 影响点 | EN | ZH | 说明 |
|---|---|---|---|
| 首页订阅区块 | `src/app/page.tsx` | `src/app/zh/page.tsx` | 新增 SubscribeForm + PushSubscribeButton |
| 博客列表页订阅区块 | `src/app/blog/page.tsx` | `src/app/zh/blog/page.tsx` | 同上 |
| revalidate 路由 | `src/app/api/revalidate/route.ts` | (共享) | 改造:加 `?notify=` |
| Service Worker | `public/sw.js` | (共享) | 新建:push/notificationclick |
| layout SW 注册 | `src/app/layout.tsx` + zh | (共享 layout) | 注册 sw.js |
| i18n 文案 | `src/i18n/messages/en.json` | `src/i18n/messages/zh.json` | 新增 `subscribe.*` |
| Notion 服务层 | `src/services/notion.ts` | (共享) | 新增订阅 CRUD |
| 新服务层 | `src/services/email.ts`、`src/services/push.ts` | (共享) | 新建 |
| 新 API 路由 | subscribe / subscribe/confirm / unsubscribe / push/subscribe | (共享) | 新建 |

**ISR 影响**:revalidate 路由已用 `force-dynamic`,改造不影响现有 ISR 缓存策略。

## 3. 验收标准(对应需求文档验收清单)

- [ ] 提交邮箱 -> 收到确认邮件 -> 点击链接后 Notion 中 status 变 active
- [ ] 浏览器点击订阅推送 -> 授权 -> Notion 落库 pushSubscription
- [ ] `GET /api/revalidate?path=/blog&notify=<slug>&secret=...` -> 收到 Web Push 通知 + 订阅邮箱收到新文章邮件
- [ ] 退订链接可用,退订后不再收到
- [ ] 某订阅地址无效时不影响其它订阅者(失败计数正确返回)
- [ ] **无 Resend / 无 VAPID Key** 时落库正常,控制台打印待发送内容,无报错
- [ ] en / zh 模板正确;深色模式 / 移动端正常

## 4. 技术约束(遵循项目编码规范)

- API 路由统一 `try/catch + NextResponse.json({error},{status})` 模式。
- Notion 写入遵循 `addInquiry` 的优雅降级模式:未配 key/DB 时返回 `{ok:false, skipped:true}` 不抛错。
- 双语文案走 next-intl,`en.json` 与 `zh.json` key 一一对应。
- 类型完整,无 any 滥用;新增逻辑有输入校验与错误处理。
- 不破坏现有功能(博客/项目/评论/询价/搜索/i18n 路由)。
- 删除被取代的死代码,不堆叠。

## 5. Notion 订阅库结构(已建,ID=39b6e6304f4d80199a76ed09a38defa6)

需求规定字段(编码前需对齐实际库结构):
- `email` (email 类型)
- `pushSubscription` (rich_text,JSON 文本)
- `locale` (select: en/zh)
- `status` (select: pending/active/unsubscribed)
- `token` (rich_text,确认/退订用签名 token)
- `createdAt` (date)

## 6. 依赖

新增 npm 依赖:`web-push`、`resend`。已获 HITL-1 批准安装。

## 7. 降级矩阵

| 场景 | 邮件 | Web Push | Notion 落库 | notify 触发 |
|---|---|---|---|---|
| 全部 Key 配齐 | Resend 发送 | web-push 推送 | ✅ 持久化 | ✅(需 REVALIDATE_SECRET) |
| 无 RESEND_API_KEY | 控制台打印 | (看 VAPID) | ✅ 持久化 | ✅ |
| 无 VAPID Key | (看 Resend) | 控制台打印 | ✅ 持久化 | ✅ |
| 无 NOTION_API_KEY/订阅库ID | skipped(不持久化,不报错) | skipped | skipped | ✅(notify 静默 no-op,listSubscribers 返回 []) |
| 全无外部 Key | 控制台打印 | 控制台打印 | ✅ 持久化 | ✅ |
| **无 REVALIDATE_SECRET** | - | - | - | ❌ revalidate 路由直接 500 |

**关键说明**:
- `REVALIDATE_SECRET` 是**本地 dev 也必须配置**的(它不是外部第三方 Key,是项目自管的触发密钥)。本地无密钥可跑指的是无 Resend/VAPID 等第三方 Key,但 `REVALIDATE_SECRET` 与 `NOTION_API_KEY` 仍需配置才能验证 notify 与落库。
- 「Notion 落库」在有 `NOTION_API_KEY`+`NOTION_SUBSCRIBERS_DATABASE_ID` 时为持久化;缺失时返回 `{ok:false,skipped:true}` 不报错(遵循 addInquiry 模式)。
- UI「演示模式」:前端探测 `NEXT_PUBLIC_VAPID_PUBLIC_KEY` 是否存在判断 push 是否可用;邮件侧无法前端探测,服务端按 Key 有无走降级。

## 8. token 安全设计(对应评审 P1-4)

- **生成**:高熵随机(32字节 hex)+ HMAC-SHA256 签名(payload=action:email:nonce),防止伪造。
- **confirm 与 unsubscribe 分 token**:各自独立 token,不共用。
- **有效期**:confirm token 7 天,unsubscribe token 30 天。
- **存储**:Notion `token` 字段存签名后的 token 串。
- **限流**:confirm/unsubscribe 端点同样按 IP 限流(与 subscribe 一致),防枚举。

## 9. 数据模型耦合(对应评审 P1-9)

- **邮件订阅**(SubscribeForm)与 **Web Push 订阅**(PushSubscribeButton)**解耦**:
  - 邮件订阅:独立行,email + status + token(confirm/unsubscribe)。
  - Web Push 订阅:PushSubscribeButton **不要求先有 email 行**。若该浏览器无对应 email 行,则新建一行(仅 pushSubscription + status=active,无 email);若已有 email 行则更新其 pushSubscription 字段。
  - notify 时:有 pushSubscription 的行发 push;有 email 且 status=active 的行发邮件。两通道独立。

## 10. notify 流的 slug->post 解析(对应评审 P1-1)

- 仓库无 `getBlogPostBySlug`。新增辅助:`getBlogPostBySlugForNotify(slug)` 在 notion.ts,内部 `getAllBlogPosts({language:'English'}).find(p=>p.slug===slug)`,取 title/excerpt/slug。
- 文章链接:`${NEXT_PUBLIC_SITE_URL}/${locale}/blog/${slug}`(locale=en 时无 /en 前缀,按现有路由 EN 在根)。
- 类型判定:notify 当前仅支持 blog(project 暂不通知)。

## 11. 风险点(对应评审 P1-7/8 + P2)

- **Service Worker dev 缓存**:`sw.js` 顶部声明 `CACHE_VERSION`,push 事件内 `self.skipWaiting()` + activate 内 `clients.claim()`,避免开发期旧 SW 死锁。dev 模式 SW 注册可选关闭。
- **Web Push 需 HTTPS**:生产必须 HTTPS(localhost 除外)。部署到非 HTTPS 域名 push 静默失败,需在文档提示。
- **web-push Node runtime**:`web-push` 依赖 Node crypto,相关路由(subscribe/push/subscribe/revalidate)必须 Node runtime,**不可 Edge**。
- **Notion API 限流 3 req/s**:listSubscribers 分页(每页100),批量 notify 时分页请求受控。
- **Resend 发件域**:`RESEND_FROM` 域名需在 Resend 后台验证,否则发送失败。
- **失败 push 清理**:web-push 返回 410/404(subscription 失效)时,不重试,直接清除该行 pushSubscription 字段(瞬态错误才重试一次)。
- **GET revalidate 副作用**:带 secret 的 GET URL 若被预取/爬虫命中会触发群发。接受现有设计(secret 已缓解),但 secret 不外泄。

## 12. 本地验证步骤产出(对应需求7/通用约束,评审 P2-14)

完成后输出 `deployment/verification-steps.md`,含「有 Key」与「无 Key」两种验证步骤。

