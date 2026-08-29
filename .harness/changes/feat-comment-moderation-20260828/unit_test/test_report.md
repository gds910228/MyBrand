# 单元测试报告（feat-comment-moderation，A 路径）

- 日期：2026-08-28
- 框架：vitest（项目已就位，未引入新依赖）；node 环境；singleFork 顺序执行
- 命令：`npm test`（= `vitest run`）

## 结果（真实输出）

```
 Test Files  11 passed (11)
      Tests  122 passed (106)
   Duration  ~60s
```

新增测试文件 7 个（既有 4 个不回归，33 用例）：

| 测试文件 | 用例数 | 覆盖 |
|---|---|---|
| `__tests__/spamScore.test.ts` | 28 | 正常基线 0 分（en/zh/短正常）；10 类规则独立命中正分+reason 码；边界 29/30/69/70；阈值/词表/权重注入；频率注入；纯中文不触发 caps；S2/S3 场景对齐 |
| `__tests__/commentTree.test.ts` | 9 | normalize 兜底；建树/孤儿丢弃；**非变异+双次幂等**（防重复挂回复回归）；filterApprovedTree 三路径；旧数据可见 |
| `__tests__/notionCommentMapper.test.ts` | 6 | 大写选项名 toLowerCase→status；null/缺失/非法→approved；Score/Reasons 防空 |
| `__tests__/comments-data.test.ts` | 13 | 本地兜底层：种子兜底可见；三态过滤；隐藏父下回复孤儿；setLocalCommentStatus 翻转可见性；admin 计数/过滤/limit；**公共树不泄露治理字段（P0-1 回归）** |
| `__tests__/comments-route.test.ts` | 15 | POST 三态落库/响应语义；spam 与 pending 同构且不含 score/reasons；approved 响应剥字段；429（第 11 次）；畸形 JSON 400；非法输入 400；邮件 throw 仍 200；同邮箱第 4 次 freq；zh body 选 zh 邮件；GET 防泄露 |
| `__tests__/admin-comments-route.test.ts` | 13 | 鉴权三态（无/错 token 401、未配置 localhost 放行、未配置远程 403）；流转参数；field-missing 400；not-found 404 |
| `__tests__/email-escaping.test.ts` | 5 | escapeHtml 五字符；降级 skipped 不抛；**组合 HTML 含转义实体、无原始恶意标签、链接 encodeURIComponent**；zh 模板 |

合计新增 89 用例（+ 既有 33 基线 = 总计 122）。

## 需求 7 覆盖映射

- a) spamScore：规则独立正分 / 正常 <30 / 边界 29-30-69-70 / 注入 / 纯函数（无时钟，频率注入）✅
- b) 状态过滤：嵌套回复树、本地 fallback（统一后的 src/data/comments）、旧数据无字段兜底 approved ✅（双份 fallback 已统一为单一数据源，见 spec v2.1）
- c) POST 三态分流：mock 落库断言 status、响应语义、spam 不泄露 score/reasons ✅
- d) 后台流转与鉴权：无 token/错 token/未配置三态 + 字段缺失错误码 ✅

## TDD 说明

纯函数/数据层（spamScore、commentTree、notionCommentMapper、comments-data）先写测试确认红（模块缺失/断言失败）再实现转绿；路由层测试在实现后补齐并真实拦截到 P0-1 泄露（由 code review 驱动补断言）。
