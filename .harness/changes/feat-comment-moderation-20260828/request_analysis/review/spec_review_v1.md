# Spec Review v1（需求评审第 1 轮）

- 评审对象：request_analysis/spec.md（v1）、tasks.md（v1）
- 评审人：reviewer subagent（general-purpose，只读评审）
- 日期：2026-08-28
- **结论：REJECTED**（0 P0 / 5 P1 / 10 P2）

评审摘要：spec 的代码实读部分经逐条核对全部属实（Notion 属性名、data/comments.ts 零 import、adminAuth 语义、email 降级模式、vitest 配置）；评分权重算术经手工复核满足 S1/S2/S3；纯函数纪律、spam/pending 响应同构、回复树孤儿丢弃设计正确。以下为存活问题。

## P1（编码前必须修）

### P1-1 双 fallback 验收口径自相矛盾：data/comments.ts 是零引用死代码且数据为预嵌套结构
- 位置：spec §1.3 末条、§5.1.2、§6；tasks T1/T5/T3/T12。
- 事实：`src/data/comments.ts` grep 确认无任何 import；其种子数据是**预嵌套**的（comment-1.replies=[comment-2]），而 `filterApprovedTree(flat)` 吃扁平列表；该文件也没有 setCommentStatus 对应物。§5.1.2「两份本地 fallback 口径一致」无法测试，T12 的双 fallback 测试断言无法落在该文件。
- 修复选项：(a) 宣告死代码保留、仅类型兼容 + 守卫测试断言无人 import；(b) 做实一致性（扁平种子、走 filterApprovedTree、补 setCommentStatus、补测试）。
- **spec v2 采纳 (b) 的强化版：本地兜底统一到 src/data/comments.ts（架构上 src/data 本就是本地兜底层），notion.ts 改为 import 复用——双份变单份单一数据源，重复类型/重复种子/重复建树逻辑一并消除（用户已授权「双份 fallback 统一作为 spec 议题决策」）。**

### P1-2 后台审核队列会静默漏项：status 过滤与计数在 50/100 行窗口内内存计算
- 位置：spec §1.3 getAllCommentsForAdmin、§1.6；T5。
- 问题：page_size 50（上限 100）按 CreatedAt desc 拉取后内存过滤；当文章评论 >50 且最新 50 条都是 approved 时，**待审 tab 为空、徽标计数 0，而更老的 pending 真实存在**——工作台核心功能静默失效。
- 修复：探测确认 ModerationStatus 存在时，计数与 tab 列表走 Notion select 过滤查询（pending/spam 集合本身小）；字段不存在时才内存过滤（此时所有行兜底 approved，无 pending 可漏）。本地 fallback 计数精确。

### P1-3 通知邮件把不可信内容插值进 HTML，无转义要求
- 位置：spec §1.5；email.ts 新增函数。
- 问题：现有邮件模板只插值 Notion 文章数据；新邮件的 content 摘要、author.name 来自**攻击者**（且触发条件正是垃圾提交）。不转义可在站长收件箱注入 HTML/钓鱼按钮/追踪像素。截断 200 字符不等于消毒。
- 修复：spec 明确 name/email/content 插值前 HTML 转义（`&<>"'`）；URL 只由 postId/配置构造；单测断言 `<script>`/`<a href>` 被转义。

### P1-4 测试计划不触达 notion.ts 本地 fallback 分支
- 位置：T3/T5/T12；spec §5.3b。
- 问题：T12 路由测试 vi.mock('@/services/notion') 与 email，真实本地分支（localComments 过滤、三字段写入、setCommentStatus、admin 计数）零执行；T3 只测纯函数。需求 7b 明确要求「含本地双份 fallback」。
- 修复：统一后本地 CRUD 落在 src/data/comments.ts，直接单测（隐藏 pending/spam 顶级与回复、隐藏父评论下回复、无状态种子兜底 approved、setCommentStatus 翻转可见性、admin 计数）；另加一个 env-unset 的 notion.ts 接线测试。模块状态泄漏对策：每用例唯一 postId + 导出测试用 reset。

### P1-5 前端任务漏发 locale：zh 提交的通知邮件静默回落英文
- 位置：spec §1.4 step2、§1.5；T10。现状 CommentSection POST body 无 locale。
- 修复：T10 明确评论/回复 POST body 带 `locale`（组件已有 locale prop）；测试断言 locale:'zh' 选用 zh 模板。

## P2（应修/钉死）

- **P2-1** 规则语义未钉死：「链接」定义（scheme？裸域名？markdown？）、关键词大小写（须大小写不敏感）、全大写规则在拉丁字母数为 0（纯中文）时跳过、一次性邮箱命中缺 reason 码（补 `email_domain:`）。T2 测试会锁死实现，spec 先钉。
- **P2-2** 畸形 JSON body → 500 而非 400：`request.json().catch(() => ({}))` 后再校验（参照 admin/content/status 路由）。
- **P2-3** 写探测只查 ModerationStatus：站长只加了状态字段漏加 Score/Reasons 时 create 400 → 静默回落本地内存（重启丢失）。改为三字段分别探测、按探测结果逐字段门控写入；warn 明确「字段未建好前 Notion 路径审核不生效，spam 默认可见」。
- **P2-4** setCommentStatus 字段缺失检测：按需先探测（缓存）再 update；400 且错误点名属性时重新探测一次再返回 `moderation-field-missing`，不靠猜错误串。
- **P2-5** commentTree 必须非变异/幂等：现有 buildCommentTree 直接 mutate localComments 对象且**重复调用重复挂回复**（既有 bug，第二次 GET comment-2 渲染两次）。新纯函数构建全新对象/数组；加双次调用幂等测试。
- **P2-6** approved 响应回传整个 comment 对象会泄露 spamScore/spamReasons 字段名（值无害但暴露反垃圾 schema）：响应前剥除 score/reasons。
- **P2-7** reason 码是机器码（links:3 等），后台/邮件直接展示违反「无硬编码」：补 `admin.comments.reasonLabels` i18n 映射，未知码回落显式原值。
- **P2-8** 漏两个路由测试：邮件 send reject/throw 时 POST 仍 200（通知不阻塞，需求 4 无测试）；同邮箱第 4 次提交 freq 规则端到端。commentFrequency 导出测试用 reset。
- **P2-9** 通知 await 后再响应：失败不阻塞但 Resend 慢会拖慢评论者响应；与 subscribe 路由一致可接受，spec 钉死选择（await + try/catch，保证 serverless 日志落盘）。
- **P2-10** AdminCommentItem 形状未钉死：补 id/postId/parentId/author{name,email}/content/createdAt/status/spamScore/spamReasons（站长排查需要作者邮箱）。

## 核对无误项（无需改）

回复树过滤三路径（非 approved 顶级/回复/隐藏父下回复成孤儿）闭环；spam 与 pending 响应字节同构、时序无差异；29/30/69/70 边界正确；权重算术 S1=0、S2=75、S3=40、单词 30、freq+keyword=70 全部成立；频率经入参注入、impure tracker 隔离正确；adminAuth 四态与 Host 头语义一致；middleware 放行 /admin 与 /api；类型归位保留现有 import 路径、Locale 仍在 notion.ts；不触碰订阅/内容状态机/询价既有路径；en/zh key 当前完全对齐。
