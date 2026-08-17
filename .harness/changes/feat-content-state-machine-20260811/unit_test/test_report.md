# 单测报告 - 内容状态机 + 定时发布(阶段5,A 路径)

> 日期:2026-08-11。框架:vitest 4.1.10(新引入,替换 `exit 0` 占位脚本)。

## 框架引入(T6.1)
- `npm install -D vitest`(38 packages)
- `vitest.config.ts`:node 环境;`@` alias 对齐 tsconfig paths;include `src/**/*.test.ts(x)`
- `package.json`:`"test": "vitest run"`(替换原 `echo ... && exit 0` 占位)
- 曾尝试 `.mts` 消除 Vite CJS 警告,触发沙箱 EPERM/worker 崩溃,回退 `.ts`(警告为 Vite 前瞻提示,无功能影响)

## 测试文件与覆盖(4 文件 31 例)

| 文件 | 对应需求 | 覆盖点 |
|---|---|---|
| `src/lib/__tests__/contentStatus.test.ts` | a) 状态过滤 + d) 流转校验 | normalizeStatus 全分支(大小写/空→published/未知→draft);filterPubliclyVisible(draft/scheduled 剔除、无 status 旧数据兜底、未知值隐藏);toNotionStatusName;isValidContentStatus 8 反例;isValidISODate 正反例 |
| `src/lib/__tests__/scheduledPublish.test.ts` | b) cron 发布 | 到期(含恰等于 now)转发布;未来时间不转;scheduled 无/坏 scheduledAt → skipped;单篇失败隔离(throw Error 与 throw 字符串两种);计数 processed/failed/skipped 精确断言 |
| `src/lib/__tests__/previewToken.test.ts` | c) token 三态 | 无 token(no-token)/malformed/签名错/串 postId(wrong-post)/过期(expired)/正确(valid);getPreviewSecret 配置与进程随机降级两态 |
| `src/lib/__tests__/adminAuth.test.ts` | d) 鉴权校验 + spec P1-2 防伪造 | 已配置:匹配/不匹配/缺失;未配置:localhost 全形态(带端口/IPv6)放行+告警、远程/空 host 403 fail-closed;**伪造 x-forwarded-host 不得放行且断言从未读取该头**;Bearer 优先于 body token |

## TDD 红→绿记录(真实,非虚构)

**红(首次运行,exit 1)**:
```
FAIL  src/lib/__tests__/previewToken.test.ts > verifyPreviewToken > 正确 token → valid
AssertionError: expected undefined to be 'expired'
  // 恰在过期时刻(now == exp)实现返回 valid,测试按 JWT exp 语义断言 expired
Test Files  1 failed | 3 passed (4)
Tests  1 failed | 30 passed (31)
```
**修**:`src/lib/previewToken.ts` 过期判定 `nowMs > exp` → `nowMs >= exp`(对齐 JWT exp 语义,宁严勿宽)。
**绿(复跑,exit 0)**:
```
Test Files  4 passed (4)
Tests  31 passed (31)
Duration  ~15s
```

## 环境噪声说明(诚实记录)
- 本沙箱对 node_modules 偶发 `EPERM: operation not permitted`(同批文件下次可读),曾致两次 run 显示 3 文件 21/25 例(非测试失败,worker 崩溃);重跑即 4 文件 31/31 全绿。阶段8 CI 门禁以全绿 run 的真实输出为准。

## 未覆盖(刻意)
- services/routes 层(依赖 Notion/Next runtime)不进单测;由阶段9 dev server curl 端到端验证。
- `getPostBySlugWithStatus` 为需求指定的后台/预览 API 面,暂无内部调用方;其行为=查询+mapPageToAdminItem(映射逻辑与列表共享),端到端验证覆盖。
