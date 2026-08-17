# 编码报告 v1 - 内容草稿/发布状态机 + 定时发布

> 日期:2026-08-11。对应 tasks.md T0-T5(T6 单测属阶段5)。

## 改动文件清单

### 新增(11 个源码文件)
| 文件 | 职责 |
|---|---|
| `src/lib/contentStatus.ts` | 状态枚举/归一化/校验纯函数(normalizeStatus: 空→published,未知→draft,大小写不敏感) |
| `src/lib/previewToken.ts` | 预览 token 签发/校验(HMAC-SHA256+timingSafeEqual);`getPreviewSecret()` 未配置时进程随机密钥降级 |
| `src/lib/scheduledPublish.ts` | 定时发布核心:`selectDueScheduledPosts` + `runScheduledPublish`(注入式,失败隔离) |
| `src/lib/adminAuth.ts` | admin 鉴权纯逻辑(只读 Host 头判 localhost,不读 x-forwarded-host) |
| `src/lib/adminMessages.ts` | admin 文案 helper(沿用 getXxxMessages 既定模式) |
| `src/services/contentStatus.ts` | 状态服务层:listAllBlogPostsWithStatus / getPostBySlugWithStatus / setStatus(返回 slug) / setScheduledAt(稳定错误码) / listScheduledPostsRaw |
| `src/services/revalidate.ts` | revalidatePath 共享 helper:revalidatePaths / revalidateBlogPaths(双语列表+详情+sitemap) |
| `src/app/api/content/[id]/preview/route.ts` | 草稿预览端点(400/401+reason/404/500) |
| `src/app/api/cron/publish/route.ts` | 定时发布端点(CRON_SECRET 未配置 401;Bearer 优先于 ?secret=) |
| `src/app/api/admin/content/route.ts` 等 4 个 | admin API:list(含 previewUrl)/status(成功后 revalidate)/schedule/publish-due |
| `src/app/admin/content/page.tsx` | 管理后台页(表格+移动卡片,状态 badge,EN/中 切换,dark: 适配) |

### 修改(4 个)
| 文件 | 改动 |
|---|---|
| `src/services/notion.ts` | getAllBlogPosts 移除 Notion 侧 Status 硬过滤→应用侧 isPubliclyVisible 收口;映射补 scheduledAt;导出 invalidateBlogListCache;getBlogPostById 补 scheduledAt + status 归一化小写 |
| `src/app/api/revalidate/route.ts` | 新增可重复 `?slug=` 展开(与 ?path= 可叠加);执行逻辑改用共享 helper;REVALIDATE_SECRET 约束不变 |
| `src/i18n/messages/{en,zh}.json` | 新增 `admin.content.*` 各 37 key(已校验一一对应) |
| `CLAUDE.md` | 补三个新 env + Notion 待加字段说明 |

### 新增配置示例
- `vercel.json.example`(每小时 cron;每天写法在 $comment 注明;不直接生效)

## 关键决策与偏差
- **T1.1-T1.3 合并为一次提交**(同属纯逻辑层新增,原子性未破坏),其余按 tasks 原子提交。
- **getBlogPostById 的 status 改为归一化小写**(原为原始大小写):全仓库无既有消费方使用 `.status`,预览端点需要规范值;getAllBlogPosts 仍返回原始值(仅内部过滤用),两者用途不同,记录在案。
- **cron/publish-due 的 revalidate 用共享 helper 直接 revalidatePath**(spec 决策 D5),不经 HTTP 自调用 /api/revalidate。
- **构建期 Notion 请求失败**:本环境 `npm run build` 静态生成时访问 api.notion.com 报 FetchError(网络受限),getAllBlogPosts 捕获后回退空数组,build 正常完成(39/39)——此为环境限制非代码缺陷;阶段9 用 dev server 实测真实链路。

## 门禁证据(阶段3)
```
$ npx next lint --file <本次16个ts/tsx文件>
✔ No ESLint warnings or errors        (exit 0)

$ npm run lint                          (全量,真实 exit=1)
→ 26 个 error 全部位于 14 个未改动文件(no-unescaped-entities 等历史遗留,
  与 feat-subscribe-webpush 时期同批,next.config.js 已注明单独治理)
→ git diff --name-only 比对:本次改动文件 0 命中

$ npm run build                         (exit 0)
✓ Compiled successfully; ✓ Generating static pages (39/39)
新路由全部在册:/admin/content、/api/admin/content{,/status,/schedule,/publish-due}、
/api/content/[id]/preview、/api/cron/publish
```
