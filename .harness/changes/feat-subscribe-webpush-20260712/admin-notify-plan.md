# Plan: 新文章通知管理页

> 需求:避免手拼 notify URL + 防误触发。做一个密码保护的管理页,列出文章,点按钮触发通知。
> 属于订阅功能(Dry Run feat-subscribe-webpush)的延伸优化,不单独建变更目录。

## 设计

### 文件清单(4 新建 + 1 提取重构)

1. **新建 `src/services/notify.ts`** - 提取 notify 逻辑为共享函数 `notifyNewPost(slug)`
   - 内部:getBlogPostBySlugForNotify -> notifyAllSubscribers + 邮件循环(含重试)
   - 返回 {ok, slug?, push, email, error?}
   - revalidate 路由和 admin API 都调它(DRY)

2. **重构 `src/app/api/revalidate/route.ts`** - notify 块改为调 `notifyNewPost(slug)`,删除内联逻辑

3. **新建 `src/app/api/admin/notify/route.ts`** - POST API(Node runtime)
   - 校验 body.password === REVALIDATE_SECRET,不符 401
   - 调 notifyNewPost(body.slug)
   - 返回结果

4. **新建 `src/app/admin/notify/page.tsx`** - 管理页(client 组件,仅中文)
   - 密码输入框(存 sessionStorage)
   - 登录后:fetch 文章列表(通过一个 API 或直接调 getAllBlogPosts?client 不能直接调,需 API)
   - 列出文章:title + slug + date + language,每篇「通知订阅者」按钮
   - 点击 -> POST /api/admin/notify {slug, password} -> 显示结果
   - 已通知标记(会话内防重复)

5. **新建 `src/app/api/admin/posts/route.ts`** - GET 文章列表 API(供管理页用)
   - 校验 password(query 参数)
   - 调 getAllBlogPosts(English+Chinese 合并)
   - 返回精简列表 [{slug, title, date, language}]

### 安全
- 密码复用 REVALIDATE_SECRET(用户决定,不新增变量)
- 密码走 POST body / sessionStorage,不进 URL、不存 Notion
- 所有 admin API 校验密码

### 双语
- 管理页仅中文(用户自用决定)
- 不接入 i18n(避免复杂化,硬编码中文可接受,因非用户面向页面)

### 不做
- 不做 EN/ZH 双语管理页
- 不做通知历史持久化(会话内标记即可)
- 不改 middleware(/admin 走默认路由,密码由页面+API 把关)

## 实现顺序
1. 提取 notify.ts
2. 重构 revalidate 路由用 notify.ts
3. 建 /api/admin/notify + /api/admin/posts
4. 建 /admin/notify 页面
5. lint + build 验证
