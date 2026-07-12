# 代码评审报告 v2(复审)

> 评审日期:2026-07-12
> 评审者:Application Owner(对照 v1 的 P0/P1 清单逐项核验修复)
> 结论:**APPROVED ✅**(P0 全清,P1 全清,关键 P2 已修)

## P0 修复核验

| # | v1 问题 | v2 修复 | 核验 |
|---|---|---|---|
| P0-1 | 确认邮件链接指向页面 | email.ts:88 改为 `/api/subscribe/confirm?token=&locale=` | ✅ |
| P0-2 | 退订邮件链接指向页面 | email.ts:118 改为 `/api/unsubscribe?token=&locale=` | ✅ |

## P1 修复核验

| # | v1 问题 | v2 修复 | 核验 |
|---|---|---|---|
| P1-1 | confirm/unsubscribe 无限流 | 抽共享 rateLimit.ts,三路由都用 | ✅ |
| P1-2 | token secret 硬编码回退 | `\|\| ''` fail-closed,signToken 无 secret 抛错 | ✅ |
| P1-3 | 已退订可被重激活 | confirmSubscriber 判 unsubscribed 拒绝 | ✅ |
| P1-4 | 邮件无重试 | revalidate 邮件循环瞬态失败重试一次 | ✅ |
| P1-5 | 缺 removeSubscriber | 新增(archived 删除) | ✅ |
| P1-6 | 缺 verification-steps.md | 已产出(本轮评审前) | ✅ |
| P1-7 | 演示文案硬编码 | 移入 i18n demoDesc,组件读取 | ✅ |
| P1-8 | zh确认页标题错 | 改为"订阅已确认" | ✅ |
| P1-9 | status 属性类型存疑 | 经核对实际库为 status 类型,代码正确 | ✅(无需改) |

## P2 修复(采纳的)

| # | 修复 | 核验 |
|---|---|---|
| P2-1 | timingSafeEqual 常量时间比较 | ✅ |
| P2-3 | 限流 Map 定期清理过期 entry | ✅(rateLimit.ts cleanup) |
| P2-6 | push-only 行存 locale | ✅(addPushSubscription 接收 locale) |
| P2-8 | require('crypto') 改顶部 import | ✅ |
| P2-18 | (notion.ts 末尾换行) | 待 build 后确认 |

## 未修(记录后续,P2 非阻塞)

P2-2(notify any 类型)、P2-4(幂等不重发token)、P2-5(endpoint contains 去重)、P2-9(createdAt 读取靠兜底)、P2-10(pushSkipped 死字段)、P2-12(单失败未console)、P2-13(as any)、P2-14(eslint ignoreDuringBuilds 全局)、P2-15(SW 重复注册)、P2-16(client bundle 体积)、P2-17(Buffer.from)。

## build 门禁(修复后)

```
✓ Compiled successfully
✓ Generating static pages (36/36)
```
类型检查通过,36/36 页面生成。

## 评审轮次

- 轮次1:REJECTED(2 P0 + 9 P1)
- 轮次2:APPROVED(P0/P1 全清)✅

未超 ≤2 轮上限。进入阶段7(代码推送)。
