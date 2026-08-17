# 单测评审 v1 — 内容状态机 vitest 套件

> 日期:2026-08-11
> 评审对象(commit ae6e5a7):
> - 测试:`src/lib/__tests__/contentStatus.test.ts`、`scheduledPublish.test.ts`、`previewToken.test.ts`、`adminAuth.test.ts`、`vitest.config.ts`、`package.json`("test": "vitest run")
> - 被测实现:`src/lib/contentStatus.ts`、`scheduledPublish.ts`、`previewToken.ts`、`adminAuth.ts`
> - 报告:`.harness/changes/feat-content-state-machine-20260811/unit_test/test_report.md`
> **结论:APPROVED**(P0=0,P1=0,P2=5)

## 验证方式

- 通读 4 个测试文件与 4 个被测实现全文,逐条对照 spec(`request_analysis/spec.md` §1.1–§1.4、D1)。
- `npm test` 实跑:首轮 4 文件 31/31 全绿;第二/三轮复现报告所述沙箱 `EPERM: operation not permitted, open node_modules/vitest/...` 致 worker 崩溃(3 文件 25 例或 2 文件 15 例,非测试失败);重试后再次 4 文件 31/31 全绿。报告中的「环境噪声说明」属实,全绿 run 可作门禁依据。
- 红→绿记录核验:`git show ae6e5a7 -- src/lib/previewToken.ts` 确认过期判定 `nowMs > exp` → `nowMs >= exp` 与测试边界断言同步修改,记录真实。
- 接线核验:grep 确认全部 10 个被测导出均被真实路由/服务引用(`api/cron/publish`、`api/admin/content/{status,schedule,publish-due,route}`、`api/content/[id]/preview`、`services/contentStatus.ts`、`services/notion.ts`),不存在测死代码。
- `Date.parse('2026-13-45T99:99')` 在 V8 下实测为 `NaN`,`isValidISODate` 反例断言真成立,非凑巧通过。

## Strengths

1. **四条需求基准全部真实命中,断言钉行为**:
   - a) 状态过滤:`filterPubliclyVisible` 用 7 篇混合 fixture 精确断言可见 id 序列 `['1','4','5','6']`——draft/scheduled/未知值被剔、无 status 旧数据兜底可见,一条用例覆盖 spec §1.1 全部兼容语义;
   - b) cron 发布:到期(含恰等于 now)/未来/缺日期/坏日期/大小写/失败隔离,`processed`/`failed`/`skipped` 三数组精确相等断言,且失败隔离分别用 `throw Error` 与 `throw 'string'` 验证 `error?.message || String(error)` 两条路径;
   - c) token 三态:no-token/malformed/bad-signature/wrong-post/expired/valid 六种判定各有独立断言,reason 码逐一钉死;
   - d) 输入校验:`isValidContentStatus` 8 个反例(含非字符串 123/{})、`isValidISODate` 正反例,对齐 spec D1。
2. **无 mock 滥用、无假测试**:全套件仅两处 test double,均合法——`runScheduledPublish` 的 `publish` 是被测函数刻意设计的 DI 注入点(测的是编排:筛选/隔离/计数,非注入体本身);`adminAuth` 的 `fakeRequest` 是最小结构假对象,且伪造 `x-forwarded-host` 用例同时断言「返回 403」与「该头从未被读取」(read 记录),是行为验证而非测 mock 存在。无快照、无空断言。
3. **边界意识到位且双向**:`scheduledAt == now` → due(`<=` 若误写 `<` 立即红);`exp == now` → expired(真实抓到过 `>` 实现的 bug);localhost 全形态(裸 host/带端口/127.0.0.1/`[::1]`/`[::1]:3000`);`localhost.evil.com` 子域名冒充被拒。
4. **确定性与环境隔离处理好**:所有时间用固定常量(NOW),断言不依赖真实时钟/随机/网络;`evaluateAdminAccess` 用例显式注入 `configuredToken`(对环境变量免疫);依赖 `process.env` 的用例均在开头先 set/delete 自检,对 CI 环境中可能残留的 `ADMIN_TOKEN`/`PREVIEW_TOKEN` 鲁棒;vitest forks 池天然做文件间隔离。
5. **测试与 spec 语义逐字对齐**:空→published、未知非空→draft(spec 21/32 行)、只读 Host 头(73 行)、进程随机降级密钥(47 行)、`<= now` 到期与单篇失败隔离(55 行)均有对应断言,无测出与 spec 相悖的期望。

## Issues

无 P0(无假测试,核心路径均已覆盖)。无 P1。

### P2-1 verifyPreviewToken 两个防御分支未覆盖
`previewToken.ts` L93–98(有效签名但 payload 非 JSON → `malformed`)与 L101 第一析取支(`exp` 非 number → `expired`)无用例;需用 `crypto` 自签垃圾 payload 才能命中。攻击者无密钥不可达,风险低,但属「错误 token」处理的明示分支,补齐成本低。

### P2-2 generatePreviewUrl 无测试
`generatePreviewUrl`(baseUrl 尾斜杠剥离 + 降级时 console 打印 URL)是 admin 后台「复制预览链接」的生成点,逻辑虽小但是公开行为;可用 `vi.useFakeTimers()` 固定 `Date.now()` 后断言 URL 形态。

### P2-3 scheduledPublish.test.ts fixture 的 slug 为损坏的常量
`post()` helper 中 `` slug: `slug-$moonshotaccount1_HaaS` `` 疑似模板插值被破坏后的残留,所有 fixture 共享同一 slug。当前无任何断言依赖 slug,无害;但属误导性脏数据,建议改回 `` `slug-${id}` `` 或删除该字段。

### P2-4 process.env 与 console.warn spy 未用 afterEach 兜底清理
`PREVIEW_TOKEN`/`ADMIN_TOKEN` 的 set/delete、`warn.mockRestore()` 都写在测试体末尾;断言中途抛错会残留。当前每个依赖用例开头自检 env,实际不会导致虚假绿/红,故仅 P2;建议 `afterEach` 统一 `delete` + `vi.restoreAllMocks()`。

### P2-5 adminAuth 可选边界补充
大写 host(`LOCALHOST:3000`,实现有 toLowerCase)与 `authorization: bearer tok`(小写前缀,实现只认 `Bearer `)两条行为未钉;后者决定了「小写 bearer 头回落到 body token」的语义,值得一条用例固定下来,防止未来「顺手兼容」改成大小写不敏感而无人察觉。

## Assessment

这是一套高质量的新引入单测:四条需求基准(a 状态过滤 / b cron 发布 / c token 三态 / d 流转校验+鉴权)全部有真实行为断言命中;边界(恰等于 now、恰等于 exp、IPv6/带端口 host、伪造 x-forwarded-host)双向覆盖;无 mock 滥用、无快照敷衍、无无断言用例;红→绿记录经 commit diff 核验为真;报告的沙箱 EPERM 噪声说明经复跑核实属实,重试即 31/31 全绿。被测函数均确认接线到真实路由,无测死代码。遗留仅为 P2 级:两个防御分支与 `generatePreviewUrl` 未覆盖、fixture 脏数据、清理兜底与可选边界补充,均不构成本次准入阻塞,可在后续迭代顺手补齐。**APPROVED**,可进入阶段7/8。
