# 变更追溯 - feat: 邮件订阅 + 新文章 Web Push 推送

> Single Source of Truth。每阶段完成后立即更新。

## 基本信息
- **变更类型**：feat
- **需求名称**：subscribe-webpush
- **创建日期**：2026-07-12
- **来源**：`docs/方舟Coding众测/个站开发提示词1.md` 角度2
- **开发分支**：`main`（本项目默认在 main 开发，不切 feature 分支；阶段3 切的 feat/subscribe-webpush 已合并回 main 并删除）

## 阶段状态

| 阶段 | 状态 | 评审轮次 | 门禁证据 | 备注 |
|---|---|---|---|---|
| 1 需求分析 | ✅ | - | spec 三段齐全 | HITL-1 已决议 |
| 2 需求评审 | ✅ | 2轮(v1 REJECTED->v2 APPROVED) | 9个P1全清 | - |
| 3 编码实现 | ✅ | - | lint+build 通过 | T0-T9 全完成,阻塞已解除 |
| 4 编码评审 | ✅ | 2轮(v1 REJECTED 2P0+9P1->v2 APPROVED) | P0/P1全清 | code_review_v1/v2 |
| 5 单测编写 | ⏭️ 跳过 | - | - | 项目无测试框架,B路径 |
| 6 单测评审 | ⏭️ 跳过 | - | - | 同上 |
| 7 代码推送 | ⬜ | - | - | - |
| 8 CI验证 | ✅ | - | lint+build+降级手测全过 | ci_result.md |
| 9 部署验证 | ⬜ | - | - | 需HITL-3真实Key+浏览器 |
| 10 用户确认 | ⬜ | - | - | HITL-4 最终验收 |

## HITL-1 决议(2026-07-12)
1. **Notion 订阅库已建**,ID=`39b6e6304f4d80199a76ed09a38defa6`,作为 `NOTION_SUBSCRIBERS_DATABASE_ID` 写入 `.env.local`。订阅链路可真实写入验证。
2. **Dry Run 走完整十阶段**,阶段9需用户配合提供真实 Resend/VAPID Key 并在浏览器测试 Web Push,阶段10用户验收。
3. **允许安装新依赖** `web-push` + `resend`。

## 门禁证据摘要
- (阶段3) lint:
- (阶段8) build:
- (阶段9) revalidate 响应:
- (阶段9) 页面验证 EN/ZH:

## 遗留 P2
- (待记录)

## 🚫 当前阻塞(阶段3-T1)
**Notion 订阅库 `39b6e6304f4d80199a76ed09a38defa6` 未共享给 integration "TestSite"。**
- API 无论当作 database 还是 page 都返回 `object_not_found` + "shared with your integration"。
- blog/project 库能连是因为它们各自共享过;新库必须**单独**再共享。
- **解除阻塞操作**:Notion 打开订阅库 -> 右上角「...」-> Connections -> 添加「TestSite」-> 确认共享。
- 若该 ID 实际是个页面(URL 是 `/p/` 路径),需在页面内新建一个 database,再用 database 的 ID。
- 解除后我重试查字段结构,继续 T1。

## 已完成
- T0 基建:分支 `feat/subscribe-webpush`、装 web-push+resend、生成 VAPID 密钥、.env.local 追加订阅环境变量(RESEND_API_KEY 暂注释走降级)
- T8 i18n(待做,与T1无依赖可后补)

## 环境变量(新增)
```
NOTION_SUBSCRIBERS_DATABASE_ID=39b6e6304f4d80199a76ed09a38defa6
RESEND_API_KEY=re_xxx                       # 可选,不填则邮件走控制台打印
RESEND_FROM=MisoTech <noreply@yourdomain>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=Bxxx           # web-push generate-vapid-keys 生成
VAPID_PRIVATE_KEY=xxx
VAPID_SUBJECT=mailto:you@example.com
REVALIDATE_SECRET=<已有>
```
