# 本地验证步骤 - 邮件订阅 + Web Push

> 对应需求文档「通用约束」:完成后输出本地验证步骤,分「有 Key」与「无 Key」两种。

## 环境准备

```bash
# 1. 依赖已装:web-push + resend + @types/web-push
# 2. .env.local 必须配置(本地 dev 也需要):
#    NOTION_API_KEY、NOTION_SUBSCRIBERS_DATABASE_ID、REVALIDATE_SECRET
# 3. 启动 dev(端口 4000,加载 .env.local):
npm run dev:env
```

## A. 无 Key 验证(降级模式,核心约束)

**前置**:`.env.local` 中 `RESEND_API_KEY` 注释掉(已默认)。VAPID 密钥已配(本地生成)。

1. **订阅区块渲染**:访问 `http://localhost:4000/` 与 `/zh`,页面底部出现 SubscribeSection,EN/ZH 文案正确,无「演示模式」提示(因 VAPID 已配)。
2. **邮件订阅降级**:
   - 输入邮箱提交 -> `/api/subscribe` 返回 `{ok:true}`
   - Notion 订阅库新增一行 status=pending(真实落库,因 Notion key 已配)
   - 服务端控制台打印 `[email:demo] confirm email -> <邮箱> ...`(无 Resend Key,降级打印)
3. **确认流程**:从 Notion 复制该行的 token 字段,切分出 confirm 部分,访问 `/api/subscribe/confirm?token=<confirm>&locale=en` -> 重定向到 `/subscribe/confirm?status=confirmed` -> Notion 中该行 status 变 active。
4. **Web Push 订阅**:点「Enable Notifications」-> 授权 -> `/api/push/subscribe` 落库 pushSubscription(Notion 新行或更新)。
5. **notify 触发(降级)**:
   ```
   curl "http://localhost:4000/api/revalidate?path=/blog&notify=<某文章slug>&secret=REVALIDATE_SECRET_ARCHER_2026"
   ```
   - 返回 JSON 含 `notify.push`(有 VAPID 则真推送,无订阅者则 0/0/0)和 `notify.email.skipped`(无 Resend Key,降级打印计数)
   - 服务端控制台打印 `[email:demo] new-post email -> ...`
6. **退订**:用 unsubscribe token 访问 `/api/unsubscribe?token=<unsubscribe>&locale=en` -> 重定向退订页 -> Notion status 变 unsubscribed。
7. **全程无报错**(核心约束满足)。

## B. 有 Key 验证(完整功能)

**前置**:取消注释 `.env.local` 的 `RESEND_API_KEY=re_xxx` 与 `RESEND_FROM=...`(Resend 后台需验证发件域)。

1. 邮件订阅提交 -> **真实收到**确认邮件(Resend 发送)。
2. 点确认链接 -> status=active。
3. notify 触发 -> 订阅邮箱**真实收到**新文章邮件 + 浏览器收到 Web Push 通知。
4. 退订 -> 不再收到。

## C. Web Push 浏览器验证

- Web Push 需 HTTPS(localhost 除外),本地 dev 可用。
- 生产部署必须 HTTPS,否则 push 静默失败。
- VAPID 密钥生成:`npx web-push generate-vapid-keys`

## D. 双语 e2e

- EN:`/`、`/blog`、`/subscribe/confirm`、`/unsubscribe`
- ZH:`/zh`、`/zh/blog`、`/zh/subscribe/confirm`、`/zh/unsubscribe`
- 两套页面结构一致,文案对应。

## 已知限制

- IP 限流用内存 Map,多实例/serverless 下不可靠(单实例 dev 验证 OK)。
- 既有项目 lint error(no-unescaped-entities 等)已用 `eslint.ignoreDuringBuilds` 在 build 阶段隔离,需单独治理。
- Service Worker dev 模式有缓存,改 sw.js 后需刷新或用 `self.skipWaiting()`(已实现)。
