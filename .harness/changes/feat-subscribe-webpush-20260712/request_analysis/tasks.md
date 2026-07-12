# Tasks - 邮件订阅 + Web Push

> 按 writing-plans 原子粒度拆解。每个任务可一次提交完成。涉及 EN/ZH 镜像的成对标注。

## To Do

### T0 基建
- [ ] T0.1 切 feature 分支 `feat/subscribe-webpush`
- [ ] T0.2 `npm install web-push resend`
- [ ] T0.3 `.env.local` 追加环境变量清单:`NOTION_SUBSCRIBERS_DATABASE_ID=39b6e6304f4d80199a76ed09a38defa6`、`RESEND_API_KEY`、`RESEND_FROM`、`NEXT_PUBLIC_VAPID_PUBLIC_KEY`、`VAPID_PRIVATE_KEY`、`VAPID_SUBJECT`、复用 `REVALIDATE_SECRET`、复用 `NEXT_PUBLIC_SITE_URL`
- [ ] T0.4 生成 VAPID 密钥对(`npx web-push generate-vapid-keys`),填入 .env.local

### T8 i18n 文案(前置,组件依赖文案)
- [ ] T8.1 en.json 新增 `subscribe.*`(标题/占位/按钮/状态/演示模式提示/邮件文案变量/确认页/退订页)
- [ ] T8.2 zh.json 镜像同 key
- [ ] T8.3 邮件模板文案 en/zh(在 email.ts 内,含退订链接)

### T1 Notion 订阅服务层 (`src/services/notion.ts`)
- [ ] T1.1 查询 Notion 订阅库实际字段结构,对齐 spec §5(以实际库为准,统一大小写,复用现有 DB ID 连字符规范化)
- [ ] T1.2 新增 `SubscriberType` 接口 + `SUBSCRIBERS_DATABASE_ID` 常量(复用现有规范化)
- [ ] T1.3 `addSubscriber(email, locale)` -> 落库 status=pending + 生成 confirm/unsubscribe 双 token(见 spec §8),幂等
- [ ] T1.4 `confirmSubscriber(token)` -> 校验签名+有效期 -> status=active
- [ ] T1.5 `unsubscribe(token)` -> 校验签名 -> status=unsubscribed
- [ ] T1.6 `listSubscribers({status?, locale?, hasPush?})` -> 分页查询(每页100,处理>100订阅者)
- [ ] T1.7 `addPushSubscription(pushSubscription)` -> 解耦:无 email 行则新建(仅 push+status=active),有则更新(见 spec §9)
- [ ] T1.8 `clearPushSubscription(email/标识)` -> 清除失效 push 字段(对应 410/404 失败清理)
- [ ] T1.9 `getBlogPostBySlugForNotify(slug)` -> getAllBlogPosts find,取 title/excerpt(见 spec §10)
- [ ] T1.10 所有函数遵循 addInquiry 降级模式(无 key/DB 返回 skipped 不抛错;listSubscribers 返回 [])

### T2 邮件服务层 (`src/services/email.ts` 新建)
- [ ] T2.1 Resend 客户端封装,无 RESEND_API_KEY 时降级为 console.log
- [ ] T2.2 确认邮件模板(double opt-in 链接,带 confirm token),en/zh 双模板
- [ ] T2.3 新文章通知邮件模板(标题+摘要+链接+**退订链接**),en/zh 双模板
- [ ] T2.4 统一返回 `{ok, skipped?, error?}`

### T3 Web Push 服务层 (`src/services/push.ts` 新建)
- [ ] T3.1 web-push 封装(setVapidDetails),无 VAPID Key 时降级 console.log
- [ ] T3.2 `sendPush(subscription, payload)` -> 单订阅发送
- [ ] T3.3 `notifyAllSubscribers(post)` -> 批量发送,单失败隔离,**瞬态错误重试一次/永久错误(410/404)直接清理不重试**(见 spec §11),返回计数

### T4 API 路由(均 Node runtime,因 web-push 依赖 crypto)
- [ ] T4.1 `POST /api/subscribe` -> 邮箱校验 + IP 限流 + addSubscriber + 发确认邮件
- [ ] T4.2 `GET /api/subscribe/confirm?token=` -> 校验签名+有效期 -> confirmSubscriber -> **重定向到确认成功页**(带 locale)
- [ ] T4.3 `GET /api/unsubscribe?token=` -> 校验签名 -> unsubscribe -> **重定向到退订确认页**(带 locale)
- [ ] T4.4 `POST /api/push/subscribe` -> 落库 pushSubscription(解耦,见 spec §9)。VAPID 公钥前端直读 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,**不单独建下发接口**

### T5 改造 revalidate 路由
- [ ] T5.1 `src/app/api/revalidate/route.ts` 增加 `?notify=<slug>` 参数(Node runtime)
- [ ] T5.2 revalidate 完成后:getBlogPostBySlugForNotify -> notifyAllSubscribers + Resend 邮件(按 locale)
- [ ] T5.3 单订阅失败隔离 + 瞬态重试一次/永久清理 + 返回 {pushOk, pushFail, emailOk, emailFail}
- [ ] T5.4 无 Key 时控制台打印,返回 skipped 计数

### T6 Service Worker + 前端注册
- [ ] T6.1 `public/sw.js` -> 顶部 `CACHE_VERSION` + push 事件显示通知 + notificationclick 打开文章页 + `self.skipWaiting()`/`clients.claim()`
- [ ] T6.2 **仅根 `src/app/layout.tsx` 注册 sw.js**(无 zh/layout.tsx,根 scope 自动覆盖 /zh/),dev 可选关闭
- [ ] T6.3 `PushSubscribeButton.tsx` -> 申请权限 + 注册订阅 + 调 /api/push/subscribe(不依赖先订阅 email)

### T7 订阅表单组件
- [ ] T7.1 `SubscribeForm.tsx` -> 邮箱输入 + 提交 + 状态反馈(待确认/已激活)
- [ ] T7.2 `SubscribeSection.tsx` -> 组合 SubscribeForm + PushSubscribeButton + 演示模式提示(探测 NEXT_PUBLIC_VAPID_PUBLIC_KEY)
- [ ] T7.3 `SubscribeConfirmPage`/`UnsubscribePage` -> 确认/退订落地页(对应 T4.2/T4.3 重定向目标,EN+ZH)
- [ ] T7.4 深色模式 + 移动端适配 + a11y

### T9 页面接入(EN + ZH 镜像)
- [ ] T9.1 首页 `src/app/page.tsx` + `src/app/zh/page.tsx` 放 SubscribeSection
- [ ] T9.2 博客列表 `src/app/blog/page.tsx` + `src/app/zh/blog/page.tsx` 放 SubscribeSection
- [ ] T9.3 确认/退订页 `src/app/subscribe/confirm/page.tsx` + `src/app/zh/subscribe/confirm/page.tsx`(及 unsubscribe)

### T10 门禁验证(阶段4/8)
- [ ] T10.1 `npm run lint` 通过(贴输出)
- [ ] T10.2 `npm run build` 通过(贴输出)
- [ ] T10.3 降级路径手测:无外部 Key 时 dev:env 跑起来不报错(需配 REVALIDATE_SECRET + NOTION key)
- [ ] T10.4 双语 e2e 手测:EN+ZH 订阅区块渲染、确认/退订页可达
- [ ] T10.5 产出 `deployment/verification-steps.md`(有Key/无Key两种验证步骤)
