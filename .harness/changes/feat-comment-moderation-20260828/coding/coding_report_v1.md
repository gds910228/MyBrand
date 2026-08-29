# 编码报告 v1（feat-comment-moderation-20260828）

- 日期：2026-08-28
- 分支：main（快照无 .git，改动清单即提交记录，见 summary.md）
- 依据：spec v2.1 + tasks v2（T1-T13）

## 改动文件清单

### 新建（16）
| 文件 | 职责 |
|---|---|
| `src/types/comment.ts` | 共享类型：CommentStatus/CommentType(+status/spamScore/spamReasons)/NewCommentInput/AdminCommentItem/AdminCommentList/ModerationResult |
| `src/lib/spamScore.ts` | 评分纯函数：scoreComment + decideModeration + DEFAULT_SPAM_CONFIG（en/zh 词表、可疑 TLD、一次性邮箱、权重）；无时钟/网络/模块可变状态 |
| `src/lib/commentTree.ts` | 树纯函数：normalizeCommentStatus（非 pending/spam 一律 approved）、buildCommentTree（非变异/幂等）、filterApprovedTree（approved-only，孤儿丢弃） |
| `src/lib/notionCommentMapper.ts` | Notion 属性映射纯函数：select.name.toLowerCase→normalize；NOTION_STATUS_OPTION 大写选项表（spec_review_v2 P1-v2-1） |
| `src/lib/commentFrequency.ts` | 同邮箱 10 分钟频率 tracker（impure 基础设施，仿 rateLimit；含 resetForTest） |
| `src/lib/commentMessages.ts` | 前端评论组件 i18n helper（静态 JSON 模式） |
| `src/app/api/admin/comments/route.ts` | GET 后台列表（checkAdminAccess；status/limit；三态+计数） |
| `src/app/api/admin/comments/status/route.ts` | POST 状态流转（400 校验 / 401·403 鉴权 / moderation-field-missing 400 / 404） |
| `src/app/admin/comments/page.tsx` | 审核工作台（token 登录、EN/中切换、三态 tab+计数徽标、score/reasons 展示、approve/spam/pending 操作、桌面表格+移动卡片、dark:） |
| `src/lib/__tests__/spamScore.test.ts` | 22 用例 |
| `src/lib/__tests__/commentTree.test.ts` | 9 用例 |
| `src/lib/__tests__/notionCommentMapper.test.ts` | 6 用例 |
| `src/lib/__tests__/comments-data.test.ts` | 11 用例 |
| `src/lib/__tests__/comments-route.test.ts` | 11 用例 |
| `src/lib/__tests__/admin-comments-route.test.ts` | 9 用例 |
| `src/lib/__tests__/email-escaping.test.ts` | 3 用例 |

### 修改（10）
| 文件 | 变更 |
|---|---|
| `src/services/notion.ts` | CommentType 改 re-export types；删模块内 localComments/建树（委托 @/data/comments）；getCommentsByPostId 经 mapper 读三字段 + filterApprovedTree；addComment 接三态字段 + ensureCommentsDbProps 探测门控写入；新增 setCommentStatus、getAllCommentsForAdmin（select filter + 计数 + capped） |
| `src/data/comments.ts` | 改造为唯一本地兜底层（活代码）：扁平种子、getLocalCommentsByPostId/addLocalComment/setLocalCommentStatus/getAllLocalCommentsForAdmin/resetForTest；建树走 commentTree |
| `src/app/api/comments/route.ts` | POST 流水线：限流 429 → json().catch 400 校验 → 频率注入 → 评分 → 三态落库 → 通知（try/catch 不阻塞）→ approved 剥治理字段返回 / pending·spam 字节同构；GET approved-only |
| `src/services/email.ts` | escapeHtml + sendCommentModerationEmail（降级 console.log/skipped；转义用户字段） |
| `src/components/CommentSection.tsx` | 三态内联反馈（替代 alert）；POST 带 locale；不乐观插入、refetch 驱动；失败/限流保留表单 |
| `src/components/CommentForm.tsx` | 全 i18n；提交成功才清空（失败可重试） |
| `src/components/CommentList.tsx` | 全 i18n |
| `src/lib/adminMessages.ts` | 增 getAdminCommentsMessages |
| `src/i18n/messages/en.json`、`zh.json` | 新增 comments.* 与 admin.comments.*（213 leaf key，en/zh 完全对齐） |
| `vitest.config.ts` | singleFork/顺序执行（受限环境并行 fork 崩溃）；vitest 4 兼容 |

## 关键决策落实
- spam/pending 响应字节同构 `{ok:true, moderation:'pending'}`；score/reasons 仅在服务层/邮件/后台。
- 旧数据无状态字段 → normalize 兜底 approved；Notion 三字段缺失 → 探测门控写旧 schema + 醒目 warn（审核不生效）；setCommentStatus 缺字段 → moderation-field-missing。
- 后台 pending/spam 列表与计数走 Notion select filter（大写选项名），不受 100 行窗口漏项。
- 通知 await+try/catch，失败 console.error 不阻塞；邮件用户字段全部 escapeHtml。
- 双份 fallback 统一：src/data/comments.ts 为唯一本地源（spec_review_v1 P1-1 决策）。

## 阶段 9 验证期追加修复（v2 评审后）

- **跨路由模块实例隔离**（S6 实测发现）：Next dev/build 中 `/api/comments` 与 `/api/admin/comments`
  两个 route chunk 各自持有 `src/data/comments` 模块实例，内存评论存储不共享——
  后台审核看不到 POST 写入的本地兜底评论。修复：本地存储挂到 `globalThis` 单例
  （data/comments.ts，含 id 计数器），同一进程内所有路由共享；Notion 配置态本就由外部库共享无此问题。
  修复后 S6（后台 approve → 前台立即可见）全链路通过。
- 测试评审补充：rateLimit 增 resetRateLimitForTest。

## 自验（最终）
- scoped lint（改动文件）：0 error 0 warning；全量 lint 26 个历史遗留 error 与基线一致（next.config ignoreDuringBuilds）。
- tsc --noEmit：无错误。
- vitest：11 文件 **122 用例全绿**（单测阶段 106 + 测试评审补 16）。
- next build：exit 0，.next 产物含 /admin/comments 页与 /api/admin/comments 路由。
- dev 空 Key 等价验证：S1-S6 全 PASS（见 deployment/deploy_report.md）。
