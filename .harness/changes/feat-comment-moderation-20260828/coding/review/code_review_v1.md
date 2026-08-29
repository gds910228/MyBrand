# Code Review v1（编码评审第 1 轮）

- 评审人：reviewer subagent（general-purpose，只读）
- 日期：2026-08-28
- **结论：REJECTED**（1 P0 / 1 P1 / 7 P2 / 6 P3 备忘）

## P0-1【阻塞】前台 GET 经评论树泄露 spamScore/spamReasons
- 位置：commentTree.ts buildCommentTree 浅拷贝保留治理字段；data/comments.ts getLocalCommentsByPostId 不剥字段；notion.ts Notion map 带字段且 filterApprovedTree 不剥；route GET 整树序列化。
- 实证：reviewer 临测验证本地兜底路径 GET 体含 `"spamScore":20,"spamReasons":["too_short"]`；Notion 路径同形。违反 spec §1.4「score/reasons 绝不出现在任何前台响应」。
- 泄露面：spammer 可见每条 accepted 评论的分数/原因码，可反推 pending 阈值（29）与规则命中，是 spam/pending 同构要关闭的差分预言机通道。
- 修复：公共边界 commentTree.filterApprovedTree 剥离 spamScore/spamReasons（status 保留）；测试加断言。

## P1-1 路由 GET 测试 mock 掉服务层，泄露不可见
- comments-route.test.ts GET 用例返回树无治理字段；data 层测试不断言字段缺失。修复：数据层断言公共树 JSON 无 score/reasons；路由 GET 测试回带含治理字段的服务结果并断言被剥。

## P2
- P2-1 字段缺失降级路径计数错误：hasStatus=false 分支用「过滤后+分页后」items.length 计 approved/total，pending/spam tab 徽标恒 0。修复：该路径单查一次无 filter 窗口计数。
- P2-2 setCommentStatus 对 Notion 404（坏/已删 id）最终 500 且透传上游错误串；路由 not-found→404 在 Notion 路径不可达。修复：识别 object_not_found/404 → not-found；不透传上游 message。
- P2-3 探测告警只看 ModerationStatus；缺 SpamScore/SpamReasons 不告警。修复：逐字段列缺失告警。
- P2-4 计数 100 条上限未以「100+」呈现。修复：has_more → countsCapped，徽标追加 +（i18n）。
- P2-5 硬编码 UI 串：admin 页 `slug:`/`reply-to:`；CommentList `'Anonymous'`。修复：走 messages。
- P2-6 邮件转义测试未触模板（模板移除转义也能过）。修复：导出 buildCommentModerationHtml 并断言 HTML 含转义实体、无未转义注入。
- P2-7 not-found→404 分支无测试；P2-2 修后补测。

## P3（备忘，顺手修）
- 公共 Notion 评论查询未显式 page_size；探测失败不缓存（故障期每请求一次 retrieve）→ 加 60s 负缓存；link_density 分母用未 trim 长度（微小偏差）。

## 核对干净项
pending/spam 隐藏（Notion/本地/嵌套回复/孤儿/旧数据默认）正确；spam/pending 响应同构；spamScore 纯函数纪律（regex 无状态、边界 29/30/69/70 正确）；后台两路由鉴权完整、Host-only；Notion 防空与写字段门控完整；通知 await+try/catch 且 throw 不阻塞（有测试）；畸形 JSON→400；无回归（data/comments 零外部引用、CommentType re-export 兼容、en/zh key 完全对齐）。
