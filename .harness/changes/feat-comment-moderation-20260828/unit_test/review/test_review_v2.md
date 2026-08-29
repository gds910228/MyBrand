# Test Review v2（测试评审第 2 轮，修复复审）

- 评审人：reviewer subagent（test_review_v1）+ 主理人按清单逐项修复
- 日期：2026-08-28
- **结论：APPROVED**（v1 的 2 P1 + 7 P2 已处置；122 用例全绿、tsc/scoped lint 干净）

## 修复对照

| v1 发现 | 处置 | 验证 |
|---|---|---|
| P1-1 500 分支零覆盖 | 新增：POST addComment reject→500 submit_failed；GET 服务 reject→500 fetch_failed；admin GET reject→500；status update-failed→500 | comments-route/admin-comments-route 新用例 |
| P1-2 路由 GET 断言同义反复 | 改为纯透传断言（mock 返回什么就序列化什么）；泄露防护归数据层真实测试 | comments-route.test.ts |
| P2-1 clamp 未测 | limit 0→1、200→不裁、NaN→50、capped 标记 | comments-data.test.ts |
| P2-2 校验边界 | name>80、content>2000、纯空白→400；parentId 透传落库 | comments-route.test.ts |
| P2-3 评分语义缺口 | 裸域名不计链接；www. 计入；IP host 可疑；2 关键词封顶 50；短拉丁 caps 跳过；freq 4→40/5→50；邮箱大写归一 | spamScore.test.ts |
| P2-4 zh 邮件未渲染 | buildCommentModerationHtml('zh') 断言中文标签 + /zh/blog 链接 | email-escaping.test.ts |
| P2-5 后台分支 | ?status=bogus→all；畸形 JSON→400；POST 远程 403 | admin-comments-route.test.ts |
| P2-6 限流无 reset | rateLimit.ts 增 resetRateLimitForTest，路由测试 beforeEach 调用 | rateLimit.ts |
| P2-7 Notion 胶水被 mock 掩盖 | spec 既定接受风险（纯 mapper + 数据层覆盖逻辑）；阶段 9 S1-S6 空 Key 走本地兜底层等价覆盖，走查清单记录 | deploy_report.md 标注 |

## 最终规模

- 新增测试文件 7 个，新增用例 89；全套件 11 文件 **122 用例全绿**（既有 33 基线不回归）。
- 覆盖需求 7 的 a-e 全部条目；边界值 29/30/69/70、鉴权三态、三态分流与不泄露、回复树过滤、旧数据兜底、降级与不阻塞均有真实断言。
