# Code Review v2（编码评审第 2 轮，复审）

- 评审人：reviewer subagent（同 v1，带修复清单复审）
- 日期：2026-08-28
- **结论：APPROVED**（0 P0 / 0 P1；12 项发现全部修复并逐条 file:line 验证；106 用例绿、tsc 干净）

## 修复验证（评审原文核对）

- **P0-1 泄露 — 已修**：`filterApprovedTree` 经 `toPublicView` 重建公共对象（commentTree.ts），两条公共路径（data/comments.ts getLocalCommentsByPostId、notion.ts getCommentsByPostId）均经此函数；后台路径不经此函数、保留治理字段（toAdminItem / mapNotionPageToAdminItem）。
- **P1-1 测试 — 已修**：comments-data.test.ts 断言公共树 JSON 无 spamScore/spamReasons/原因码且后台条目保留；该断言对修复前代码会失败（reviewer 曾复现泄露），为真实防线。
- **P2-1 计数 — 已修**：hasStatus=false 分支单次无 filter 查询，计数独立于 tab。
- **P2-2 not-found — 已修**：object_not_found/404 → 稳定 not-found（路由 404）；其它更新错误 → update-failed；上游 message 不进响应体。
- **P2-3 告警 — 已修**：探测逐字段列缺失。
- **P2-4 计数上限 — 已修**：countsCapped 聚合 has_more，UI 追加 +。
- **P2-5 硬编码 — 已修**：slugLabel/replyToLabel i18n、Anonymous 走 messages；en/zh key 0 diff。
- **P2-6 邮件测试 — 已修**：buildCommentModerationHtml 导出并断言组合 HTML 转义实体。
- **P2-7 404 测试 — 已补**。
- **P3 — 已修**：公共查询 page_size:100；探测失败 60s 负缓存；link_density 分母用 trim 长度。

非阻塞备注：Notion 瞬态故障时 setCommentStatus 返回稳定码（update-failed→500、外层 catch→not-found 404）为保守映射，符合不泄露上游错误的设计意图。

**结论：可进入门禁与验证。**
