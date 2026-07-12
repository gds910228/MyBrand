# 代码评审报告 v1

> 评审日期:2026-07-12
> 评审者:独立 reviewer subagent(基于 git diff 工作区改动)
> 结论:**REJECTED**(2 P0 + 9 P1 + 19 P2)

## P0(阻塞,必修)

| # | 问题 | 位置 |
|---|---|---|
| P0-1 | 确认邮件链接指向页面 `/subscribe/confirm` 而非 API `/api/subscribe/confirm`,double opt-in 完全失效(用户点链接看到"无效",status 永不变 active) | email.ts:88 |
| P0-2 | 退订邮件链接同样指向页面 `/unsubscribe` 而非 API `/api/unsubscribe`,退订失效 | email.ts:118 |

## P1(重要)

| # | 问题 | 修复方向 |
|---|---|---|
| P1-1 | confirm/unsubscribe 端点无限流,违反 spec §8 防枚举 | 复用 subscribe 限流 |
| P1-2 | token secret 回退硬编码常量,可伪造任意邮箱 token | 缺失时 fail-closed |
| P1-3 | confirmSubscriber 未拒绝已退订用户,旧 token 可重激活 | 判 unsubscribed 拒绝 |
| P1-4 | 邮件通知无重试,违反需求#4"失败重试一次" | 瞬态失败重试一次 |
| P1-5 | 缺 removeSubscriber 函数(需求#1点名) | 补实现 |
| P1-6 | 缺 verification-steps.md(需求#7) | **已产出(本次评审前刚写)** |
| P1-7 | 演示模式文案硬编码,违反 i18n | 移入 i18n |
| P1-8 | 中文订阅确认页标题错为"退订确认" | 改为"订阅已确认" |
| P1-9 | Notion status 属性类型存疑(spec 标 select,代码用 status 类型) | **已核对实际库为 status 类型,代码正确** |

## P2(19项,选择性采纳)

关键:P2-1(timingSafeEqual)、P2-6(push-only locale)、P2-9(createdAt 读取)、P2-15(SW 重复注册)

## 修复决定

**P0 全部必修**(P0-1/P0-2 邮件 URL 加 /api/ 前缀)。
**P1 修复**:P1-1(限流)、P1-2(secret fail-closed)、P1-3(已退订拒绝)、P1-4(邮件重试)、P1-5(removeSubscriber)、P1-7(文案 i18n)、P1-8(标题)。
P1-6 已产出(verification-steps.md),P1-9 经核对实际库为 status 类型(代码正确,无需改)。
P2 选择性修:P2-1、P2-6、P2-9、P2-15(影响正确性的)。
