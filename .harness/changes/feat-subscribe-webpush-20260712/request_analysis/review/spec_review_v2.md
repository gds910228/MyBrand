# Spec 评审报告 v2

> 评审日期:2026-07-12
> 评审者:Application Owner(对照 v1 的 P1 清单逐项核验修订)
> 评审对象:spec.md(v2,新增§7-12) + tasks.md(v2,T8前置+补任务+删T4.5)

## 结论:APPROVED ✅

v1 的 9 个 P1 全部已修订落实,可进入阶段3编码。

## P1 修订核验

| # | v1 问题 | v2 修订 | 核验 |
|---|---|---|---|
| P1-1 | notify 流缺 slug->post 解析 | spec §10 + T1.9 getBlogPostBySlugForNotify + T5.2 引用 | ✅ |
| P1-2 | 降级矩阵落库✅与skipped矛盾 | spec §7 改为 skipped(不持久化,不报错) | ✅ |
| P1-3 | 缺 REVALIDATE_SECRET 维度 | spec §7 矩阵新增该行 + 关键说明 | ✅ |
| P1-4 | token 未签名 | spec §8 完整设计:HMAC签名/双token/有效期/限流 | ✅ |
| P1-5 | confirm/unsubscribe 无响应UI | T4.2/T4.3 重定向 + T7.3 落地页 + T9.3 镜像页 | ✅ |
| P1-6 | 新文章邮件缺退订链接 | T2.3 显式含退订链接 | ✅ |
| P1-7 | SW dev缓存策略 | T6.1 CACHE_VERSION + skipWaiting/clients.claim | ✅ |
| P1-8 | Web Push 需 HTTPS | spec §11 风险点列出 | ✅ |
| P1-9 | push/email 耦合未定义 | spec §9 解耦设计 + T1.7/T6.3 落地 | ✅ |

## P2 采纳情况

采纳:P2-1(layout表述)、P2-4(删T4.5)、P2-5(T8前置)、P2-6(分页,T1.6)、P2-7(失败清理,T1.8+T3.3)、P2-8(runtime声明,T4/T5标注)、P2-9(环境变量清单,T0.3)、P2-11(重试区分,T3.3)、P2-14(验证步骤,T10.5)。
记录后续:P2-2/3/10/12/13/15(实现时按实际情况处理或记入遗留P2)。

## 评审轮次

- 轮次1:REJECTED(v1,9 P1)
- 轮次2:APPROVED(v2,P1全清)✅

未超 ≤3 轮上限。进入阶段3编码实现。
