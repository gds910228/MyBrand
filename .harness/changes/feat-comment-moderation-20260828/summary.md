# 变更追溯：评论系统治理（反垃圾评分 + 审核状态机 + 站长通知）

- 变更 ID：feat-comment-moderation-20260828
- 类型：feat
- 创建日期：2026-08-28（云端沙箱执行；系统日期 2026-08-29）
- 执行模式：单次执行，HITL 4 确认点不暂停——待决议项 + 建议方案 + 自行采纳最稳妥选项，决策依据记录于本文件「HITL 决策记录」
- 环境说明：云端沙箱，无浏览器；外部依赖一律走「无 Key 降级路径」验证（阶段 9 强制空 Key 起 dev，不写真实 Notion/Resend）。快照含 `.env.local`（含格式真实的 key），但验证时以空环境变量覆盖，走本地 fallback + console.log 降级。
- Git：快照无 `.git` 目录 → 阶段 7 以「改动文件清单 + 变更记录」等价替代。

## 阶段状态

| 阶段 | 状态 | 轮次 | 证据 | 遗留 |
|---|---|---|---|---|
| 1 需求分析 | 完成 | — | spec.md(v2.1) / tasks.md(v2) | — |
| 2 需求评审 | 完成 | 2/3 | review/spec_review_v1.md(REJECTED 5P1+10P2) → spec_review_v2.md(APPROVED) | — |
| 3 编码实现 | 完成 | — | coding/coding_report_v1.md（16 新建 + 10 修改） | — |
| 4 编码评审 | 完成 | 2/2 | code_review_v1(REJECTED 1P0+1P1+7P2) → v2(APPROVED) | — |
| 5/6 单测（A 路径） | 完成 | 2/2 | test_report.md；test_review_v1(REJECTED 2P1+7P2)→v2(APPROVED)；**122 用例全绿** | — |
| 7 提交 | 完成（无 .git，改动清单替代） | — | 见下方「改动文件清单」 | — |
| 8 CI 等价门禁 | 完成 | — | scoped lint 0/0；全量 lint 26 历史遗留=基线；test 122✅ exit0；build ✅ exit0 | — |
| 9 部署验证 | 完成 | — | deployment/deploy_report.md：S1-S6 全 PASS（空 Key dev + curl） | — |
| 10 用户确认 | 待用户本地浏览器补验 UI | — | — | — |

## 改动文件清单（阶段 7，无 .git 等价提交记录）

**新建 16**：
- 类型：`src/types/comment.ts`
- lib：`src/lib/spamScore.ts`、`src/lib/commentTree.ts`、`src/lib/notionCommentMapper.ts`、`src/lib/commentFrequency.ts`、`src/lib/commentMessages.ts`
- API：`src/app/api/admin/comments/route.ts`、`src/app/api/admin/comments/status/route.ts`
- 页面：`src/app/admin/comments/page.tsx`
- 测试 7：`src/lib/__tests__/{spamScore,commentTree,notionCommentMapper,comments-data,comments-route,admin-comments-route,email-escaping}.test.ts`

**修改 11**：
- `src/services/notion.ts`（评论状态机/探测/计数/过滤；本地委托 data 层）
- `src/data/comments.ts`（改造为唯一本地兜底层，活代码）
- `src/app/api/comments/route.ts`（限流/校验/评分/三态/通知流水线）
- `src/services/email.ts`（escapeHtml + buildCommentModerationHtml + sendCommentModerationEmail）
- `src/components/{CommentSection,CommentList,CommentForm}.tsx`（i18n + 三态反馈）
- `src/lib/adminMessages.ts`（getAdminCommentsMessages）
- `src/lib/rateLimit.ts`（resetRateLimitForTest）
- `src/i18n/messages/{en,zh}.json`（comments + admin.comments，key 完全对齐）
- `vitest.config.ts`（singleFork 稳定性）

## HITL 决策记录（单次执行，不暂停）

| 决策点 | 选项 | 采纳 | 依据 |
|---|---|---|---|
| HITL-1a spam 响应体 | (a) 与 pending 完全同构（200 + moderation:'pending'）；(b) 独立 spam 文案 | **(a)** | 防机器人差分探测阈值；spammer 看到的与「待审核」无差别；误杀真人时其看到「待审核」也合理，站长可在后台捞回。score/reasons 只进站长邮件与后台 |
| HITL-1b 频率规则纯函数性 | 评分函数内读时钟/Map vs 注入计数 | **注入计数**（input.recentCountForEmail:number） | 纯函数可单测、无共享状态；路由侧用仿 rateLimit 的内存 tracker（impure 基础设施） |
| HITL-1c Notion 新字段缺失时 | 写失败整单回退本地 vs 探测字段降级写 | **启动期探测 + 降级写旧 schema + console.warn** | 评论不丢；字段未建时旧行为（全部 approved 可见），站长被告知需加字段；本地 fallback 下完整三态可用 |
| HITL-1d 旧数据无状态字段 | 拒绝显示 vs 兜底 approved | **兜底 approved**（normalizeStatus） | 需求硬性要求：存量评论全部保持可见 |
| HITL-1e 双份 fallback / 重复类型 | 大清理合并 vs 最小同步 | **v2 评审后升级为「统一」：src/data/comments.ts 改造为唯一本地兜底层（活代码，扁平种子+CRUD+计数），notion.ts 删除模块内 localComments 改为委托；CommentType 抽到 src/types/comment.ts，notion.ts re-export 兼容；不删 data/comments.ts** | spec_review_v1 P1-1：双份口径无法测试且矛盾；src/data 本就是架构规定的本地兜底层；用户已授权「双份 fallback 统一作为 spec 议题决策」 |
| HITL-1f 通知失败 | 阻塞评论 vs 不阻塞 | **不阻塞**：await 于 try/catch 内，失败仅 console.error | 需求硬性要求；邮件是旁路 |
| HITL-1g 收件人配置 | 新环境变量 COMMENT_NOTIFY_TO | **采纳**；未配置 → console.log 完整信息（skipped） | 与 RESEND 降级模式一致 |
| HITL-1h 回复树过滤口径 | 仅滤非 approved 节点 vs 非 approved 节点整子树隐藏 | **先按状态过滤扁平列表再建树**（非 approved 回复被滤；其父若也非 approved，回复成孤儿自然不挂载） | 双保险：pending/spam 回复不随树吐出；挂在隐藏评论下的回复也不可能显示 |
| HITL-3 部署参数 | 无生产部署；云端以空 Key dev server + curl 等价验证 | **采纳** | 沙箱无浏览器、不得写真实外部数据 |

## 遗留 P2（用户侧待办/后续治理）

1. **Notion 生产配置**：评论库需手动加 3 字段（ModerationStatus select / SpamScore number / SpamReasons text），并配 `COMMENT_NOTIFY_TO`。字段未建时代码降级为旧行为（新评论默认可见 + console.warn 逐字段告警）。
2. **Notion 路径真链路验证**：沙箱强制空 Key 不写真实数据，字段探测门控/Notion select filter 计数由纯函数单测（notionCommentMapper 等）+ 数据层测试覆盖；用户有 Key 时按 deploy_report.md 步骤本地/生产验证。
3. 全量 `npm run lint` 的 26 个历史遗留 error（no-unescaped-entities 等，非本次引入）按项目既定口径另开变更治理。
4. admin 列表/计数 100 条上限（大库时徽标显示 100+、列表提示仅显示最新 100 条）；solo 规模足够，后续可加分页。
5. UI 交互三态反馈/后台操作视觉需用户本地浏览器最终补验（云端无浏览器，已用 build+API+ i18n key 对齐等价验证）。

## 验证中发现并修复的问题（阶段 9）

- **Next route chunk 模块实例隔离**：`/api/comments` 与 `/api/admin/comments` 在 dev 下持有 `@/data/comments` 各自实例，导致内存兜底评论跨路由不可见（后台审核列表看不到新评论）。修复：本地存储与 id 计数器挂 globalThis 单例。修复后 S6 approve→前台立即可见全链路通过。
