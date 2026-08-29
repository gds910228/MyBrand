# Spec Review v2（需求评审第 2 轮）

- 评审对象：request_analysis/spec.md（v2 → v2.1）、tasks.md（v2）
- 评审人：reviewer subagent（同 v1 评审者，带上下文复审）
- 日期：2026-08-28
- **结论：APPROVED**（v1 的 5 P1 + 10 P2 全部关闭；复审新发现 1 P1 + 3 P2，已按评审给的精确修法在 spec v2.1 中钉死）

## 复审确认（v1 发现项）

| v1 发现 | v2 修法 | 复审判定 |
|---|---|---|
| P1-1 双 fallback 矛盾 | 统一为 src/data/comments.ts 唯一本地兜底层（活代码），notion.ts 委托；分层无环（types←commentTree←data/comments←notion←routes；email 仅 type import Locale） | Closed |
| P1-2 后台队列窗口漏项 | hasStatus 时 select filter 查 tab + 3 次计数；字段缺失才内存过滤（此时无 pending 可漏） | Closed（filter 值大小写见 P1-v2-1） |
| P1-3 邮件 HTML 注入 | escapeHtml 转义 name/email/content + encodeURIComponent(postId) + 专项测试 | Closed |
| P1-4 本地分支无测试 | comments-data.test.ts 直测兜底层 + 唯一 postId + reset | Closed |
| P1-5 locale 漏发 | POST body 带 locale（评论+回复）+ zh 模板测试 | Closed |
| P2-1～P2-10 | 链接语义/大小写不敏感/caps 拉丁字母<8 跳过/email_domain 码；畸形 JSON 400；三字段分别探测门控；setCommentStatus 按需探测+重探测；commentTree 非变异+幂等；approved 响应剥 score/reasons；reasonLabels；邮件 throw 测试 + freq 端到端 + reset；await 钉死；AdminCommentItem 含邮箱 | 全部 Closed |

## 复审新发现（第 2 轮）与处置

### P1-v2-1 Notion select 选项名大小写未钉死（read 反转 / filter 查 0 行 / write 静默建重复选项）
- 风险：Notion 选项名大写 `Pending/Approved/Spam`；normalize 只认小写 → read 把 Pending 误兜底 approved（审核反转）；filter 用小写查到 0 行（待审 tab 静默空）；write 小写写入被 Notion 静默新建重复选项。该路径无任何测试/curl 覆盖（路由测试 mock notion、S 矩阵空 Key 走本地）。
- 处置（spec v2.1 §1.3）：
  1. 抽纯函数 `src/lib/notionCommentMapper.ts`：`mapNotionCommentProps(properties)`——`select.name?.toLowerCase()` 后再 normalize；Score/Reasons 防空；
  2. `NOTION_STATUS_OPTION = { pending:'Pending', approved:'Approved', spam:'Spam' }` 写/查统一映射表；
  3. 新增 `notionCommentMapper.test.ts`（Pending/Spam/Approved/select:null/属性缺失）。
- 判定：**Closed**——三个方向（读小写化、写大写表、filter 大写表）全部钉死且转为纯函数可测。

### P2-v2-1 列表硬上限 100 无分页
- 处置：all/tab 列表响应标 `capped:true`，UI 提示「仅显示最新 100 条」（solo 规模可接受，已披露）。Closed。

### P2-v2-2 「非 http(s) scheme」可疑条款不可达
- 处置：独立正则 `[a-z][a-z0-9+.-]*://...` 扫描 ftp/javascript 等，仅喂可疑规则（+25/条），不计链接数；消除死条款。Closed。

### P2-v2-3 两个实现细节
- 处置：limit parseInt + clamp 1–100（垃圾值→50）；reasonLabels 查表前剥冒号后缀（`links:3`→`links`），未知码回落原值。Closed。

## 评审结论

七个需求面（评分引擎/状态机/API/通知/后台/前端/测试）全覆盖，未发现遗漏；不触碰博客/项目/询价/订阅/内容状态机等既有路径；middleware 与无关路由不动。spec v2.1 与 tasks v2 可进入阶段 3 编码。
