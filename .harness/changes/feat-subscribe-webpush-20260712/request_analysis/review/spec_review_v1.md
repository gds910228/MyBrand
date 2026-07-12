# Spec 评审报告 v1

> 评审日期:2026-07-12
> 评审者:独立 reviewer subagent(无会话历史,客观视角)
> 评审对象:spec.md + tasks.md(对应需求文档角度2)

## 结论:REJECTED(有条件,修订 P1 后可改 APPROVED)

无 P0 硬阻塞。骨架合格(覆盖7条需求结构、继承 addInquiry 降级模式、双语镜像、force-dynamic revalidate),但 9 个 P1 缺口需编码前修订,否则实现中期返工。

## P1 问题(重要,需修订)

| # | 问题 | 修订方向 |
|---|---|---|
| P1-1 | notify 流缺 slug->post 解析;仓库无 getBlogPostBySlug | 新增任务,复用 getAllBlogPosts 双语 find 或建 helper |
| P1-2 | 降级矩阵全无Key行标"Notion落库✅",与 addInquiry skipped 语义矛盾 | 改为"skipped(不持久化,不报错)" |
| P1-3 | 降级矩阵缺 REVALIDATE_SECRET 维度;无secret时revalidate直接500 | 加维度,明确本地dev需配REVALIDATE_SECRET(非外部Key) |
| P1-4 | token 未按需求"签名";明文bearer+无限流可被枚举 | 规定HMAC签名/高熵随机/有效期;confirm与unsubscribe分token;加限流 |
| P1-5 | confirm/unsubscribe 端点无响应UI/重定向任务 | 补重定向到确认页/退订页任务 |
| P1-6 | 新文章通知邮件(T2.3)未含退订链接 | 显式加退订链接 |
| P1-7 | SW dev模式缓存/更新策略未提 | 补skipWaiting/Clients.claim/版本号 |
| P1-8 | Web Push生产需HTTPS未列风险 | 补风险点 |
| P1-9 | push与email数据模型耦合未定义(PushSubscribeButton是否依赖先订阅email) | 定义耦合关系 |

## P2 问题(建议,15项,见reviewer原始报告)

关键几条:
- spec§2/T6.2 写"layout+zh",实际无 zh/layout.tsx,应改"仅根layout注册"
- 字段camelCase与现有库PascalCase不一致
- T4.4+T4.5+NEXT_PUBLIC_ 三途下发VAPID公钥矛盾,删T4.5
- T8应前置于T7(组件依赖文案)
- listSubscribers分页缺失(>100静默截断)
- 失败push subscription(410/404)清理缺失
- 新API路由runtime声明(Node,因web-push)
- IP限流serverless下内存Map不可靠

## 采纳决定

**全部 P1 采纳修订**。P2 选择性采纳(影响正确性的采纳,纯优化记录后续):
- 采纳:P2-1(layout表述)、P2-4(删T4.5)、P2-5(T8前置)、P2-6(分页)、P2-7(失败清理)、P2-8(runtime声明)、P2-9(环境变量清单)、P2-11(重试区分瞬态/永久)、P2-14(验证步骤产出)
- 记录后续:P2-2(字段大小写以实际库为准)、P2-3(连字符规范化)、P2-10(IP限流实现)、P2-12(GET副作用)、P2-13(Resend域名验证)、P2-15(演示模式探测)

修订后产出 spec_v2 与 tasks_v2,进入第二轮评审。
