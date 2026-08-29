# Test Review v1（测试评审第 1 轮）

- 评审人：reviewer subagent（general-purpose，只读，亲手跑测确认 73/73 + 全量 106/106）
- 日期：2026-08-28
- **结论：REJECTED**（2 P1 + 7 P2）；评审确认套件约 90% 真实覆盖（非表演式），边界/三态/鉴权/转义均扎实

## P1（必须修）
- **P1-1 500 错误分支零覆盖**（spec §5.1.3 验收项）：addComment reject、GET getCommentsByPostId reject、admin GET/POST reject 均未模拟；异常裸抛回归无法发现。→ 补 4 个 reject 用例断言 500 + code 信封。
- **P1-2 路由 GET 防泄露断言同义反复**：mock 自己剥字段再断言无字段，路由纯透传——剥字段回归后该测试仍过。→ 改为 mock 原样返回、断言路由忠实序列化；泄露防护由数据层真实测试承担。

## P2（本轮一并修）
- P2-1 limit clamp 分支未测（0→1、>100→100、NaN→50、capped 标记）。
- P2-2 输入校验边界未测：name>80、content>2000、纯空白 content、parentId 落库（S5 回复路径）。
- P2-3 spamScore 语义缺口：裸域名不计链接、www. 前缀计入、IP host 可疑、关键词 cap 50、短拉丁全大写跳过、freq 4→40/5→50 边界、邮箱大小写归一。
- P2-4 zh 邮件模板只验 mock 参数未渲染；补 buildCommentModerationHtml('zh') 渲染断言。
- P2-5 后台路由分支：?status=垃圾值→all、畸形 JSON→400、POST 远程 host 403、update-failed→500。
- P2-6 rateLimit 无 reset 导出：补 resetRateLimitForTest 并 beforeEach 调用（防未来用例 IP 复用踩 429）。
- P2-7 Notion 路径胶水代码被 mock 掩盖（spec 已接受的风险）：纯函数 mapper + 数据层已覆盖逻辑；阶段 9 走查清单记录。

## 评审确认的强项
边界 29/30/69/70 精确；12 类规则 reason 码全验证（含 ftp/javascript scheme 不计 links）；commentTree 非变异+幂等（钉死旧重复挂回复 bug）；mapper 大小写反转类全覆盖；数据层可见性双向翻转+精确计数+真实泄露断言；POST 三态语义（S2 响应序列化串无 score/viagra、S3 精确 toEqual）；429/畸形 JSON 400/通知 throw 仍 200/freq 端到端；鉴权四态；邮件五实体转义+encodeURIComponent。
