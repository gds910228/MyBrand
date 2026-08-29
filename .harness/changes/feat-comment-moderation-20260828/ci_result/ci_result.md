# CI 等价门禁结果（feat-comment-moderation-20260828）

- 日期：2026-08-28
- 说明：项目无 CI，按 SOP 用本地等价门禁 `npm run lint` / `npm run build` / `npm test`。以下为真实命令输出。

## 门禁 1：`npm run lint`

### 1a. scoped lint（本次改动 18 个文件）

```
$ npx next lint --file src/types/comment.ts --file src/lib/spamScore.ts --file src/lib/commentTree.ts \
  --file src/lib/notionCommentMapper.ts --file src/lib/commentFrequency.ts --file src/lib/commentMessages.ts \
  --file src/lib/adminMessages.ts --file src/lib/rateLimit.ts --file src/data/comments.ts \
  --file src/services/notion.ts --file src/services/email.ts --file src/app/api/comments/route.ts \
  --file src/app/api/admin/comments/route.ts --file src/app/api/admin/comments/status/route.ts \
  --file src/app/admin/comments/page.tsx --file src/components/CommentSection.tsx \
  --file src/components/CommentList.tsx --file src/components/CommentForm.tsx

✔ No ESLint warnings or errors
SCOPED_LINT_EXIT=0
```

### 1b. 全量 `npm run lint`（基线对照，诚实记录）

```
FULL_LINT_EXIT=1
error 行数：26，分布于 about/privacy/Hero/ProjectFilters/Toast 等未触碰文件
```

- 26 个 error 全部为 `react/no-unescaped-entities`、`react/jsx-no-comment-textnodes` **历史遗留**
  （与 feat-content-state-machine-20260811 记录的基线一致，next.config.js `eslint.ignoreDuringBuilds=true`，构建不被阻塞）。
- 机器比对：本次改动文件 **0 命中**全量 lint 报错。
- 按项目既定口径（见上一变更 ci_result.md），scoped lint 绿即通过本门禁；全量历史遗留另开变更治理。

## 门禁 2：`npm test`（vitest，A 路径真实测试）

```
$ npm test

 RUN  v4.1.10 /mnt/tos/workspace/MyBrand

 Test Files  11 passed (11)
      Tests  122 passed (122)
TEST_EXIT=0
```

- 新增测试 7 个文件 89 用例；既有 4 文件 33 用例不回归；total_tests=122 > 0。
- 覆盖：评分引擎规则/边界 29-30-69-70/注入；评论树过滤/幂等/旧数据兜底；Notion 字段映射大小写；本地兜底层三态/计数/防泄露；POST 三态分流/spam 不泄露/429/400/通知不阻塞；后台鉴权三态/字段缺失/404；邮件转义。

## 门禁 3：`npm run build`

```
$ rm -rf .next && npm run build
（首次静态生成阶段遇沙箱 EPERM 抖动——Static worker exited 1，见下；Next 重试后成功，与 feat-content-state-machine 记录的沙箱抖动同型）
 ✓ Compiled successfully
 ...
 Route (app router) 摘要（新增/相关）:
 ├ ○ /admin/comments              7.39 kB   91.6 kB      （新增，审核工作台）
 ├ λ /api/admin/comments          0 B       0 B          （新增，GET 列表）
 ├ λ /api/admin/comments/status   0 B       0 B          （新增，POST 流转）
 ├ λ /api/comments               （既有，三态流水线）
 ├ λ /blog/[slug], /zh/blog/[slug]            （评论区页）
 ...
 ƒ Middleware 40.9 kB
BUILD_EXIT=0
```

- 产物核对：`.next/server/app/admin/comments.html`、`.next/server/app/api/admin/comments/route.js`、
  `.next/server/app/api/admin/comments/status/route.js`、`.next/server/app/api/comments/route.js` 均存在。
- 日志中的 `Dynamic server usage` 为既有页面（unsubscribe/subscribe confirm/projects API）动态化提示，非本次引入。
- 类型检查由 build 前 `tsc --noEmit` 单独验证：0 error。

## 门禁结论

| 门禁 | 结果 |
|---|---|
| scoped lint（本次 18 文件） | ✅ 0 error 0 warning |
| 全量 lint | exit 1，26 个历史遗留（=基线，非本次引入，ignoreDuringBuilds） |
| npm test | ✅ 11 文件 122 用例全绿，exit 0 |
| npm run build | ✅ exit 0，新页面/API 路由均产物化 |

