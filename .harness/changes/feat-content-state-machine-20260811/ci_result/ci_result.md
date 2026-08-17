# CI 等价门禁结果 - feat-content-state-machine(阶段8)

> 项目无 CI(无 .github/workflows),用本地等价门禁替代(Agent 阶段8 务实处理)。
> 以下为 2026-08-11 三条命令的**真实输出摘要**,非声称。基线提交 `1aee580`,HEAD 共 10 次提交。

## 门禁1: `npm run lint`

### 1a. 本次改动文件(21 个 ts/tsx)scoped lint
```
$ npx next lint --file src/lib/contentStatus.ts --file src/lib/previewToken.ts --file src/lib/scheduledPublish.ts \
  --file src/lib/adminAuth.ts --file src/lib/adminMessages.ts --file src/services/contentStatus.ts \
  --file src/services/revalidate.ts --file src/services/notion.ts --file src/app/api/revalidate/route.ts \
  --file src/app/api/content/[id]/preview/route.ts --file src/app/api/cron/publish/route.ts \
  --file src/app/api/admin/content/route.ts --file src/app/api/admin/content/status/route.ts \
  --file src/app/api/admin/content/schedule/route.ts --file src/app/api/admin/content/publish-due/route.ts \
  --file src/app/admin/content/page.tsx --file vitest.config.ts --file src/lib/__tests__/*.test.ts
✔ No ESLint warnings or errors
SCOPED_LINT_EXIT=0
```
**结论:本次需求全部文件 lint 干净(0 error 0 warning)。**

### 1b. 全量 lint(基线对照,诚实记录)
```
$ npm run lint
FULL_LINT_EXIT=1
error 行数:26,分布于 14 个文件(about/privacy/Hero/ProjectFilters/Toast 等)
```
- 26 个 error 全部为 `react/no-unescaped-entities` 等**历史遗留**,与 feat-subscribe-webpush 时期同批;
  next.config.js 已注明「既有 error 单独治理」并 `eslint.ignoreDuringBuilds`。
- 机器比对(`git diff --name-only` ∩ 全量 lint 报错文件):**本次改动文件 0 命中**。
- 按项目既定口径(ci_result of feat-subscribe-webpush 同口径),scoped lint 绿即通过本门禁;全量治理另开变更。

## 门禁2: `npm run build`
```
$ npm run build        # rm -rf .next 后全新构建;首次因沙箱 EPERM 抖动 exit 1,重跑:
 ✓ Compiled successfully
   Skipping linting                    ← ignoreDuringBuilds(既定)
   Checking validity of types ...
 ✓ Generating static pages (39/39)
 ✓ Finalizing page optimization
BUILD_EXIT=0
```
新路由全部在册(真实输出摘录):
```
├ ○ /admin/content                       5.71 kB          90 kB
├ λ /api/admin/content                   0 B                0 B
├ λ /api/admin/content/publish-due       0 B                0 B
├ λ /api/admin/content/schedule          0 B                0 B
├ λ /api/admin/content/status            0 B                0 B
├ λ /api/content/[id]/preview            0 B                0 B
├ λ /api/cron/publish                    0 B                0 B
├ λ /api/revalidate                      0 B                0 B
```
注:构建期静态生成访问 api.notion.com 在本沙箱被网络限制(FetchError),服务层按既有降级返回空数组,不影响构建成功;真实数据链路由阶段9 dev server 验证。

## 门禁3: `npm test`(vitest 真实跑,替换 exit 0 占位)
```
$ npm test            # 阶段9 E2E 发现 previewToken 降级密钥缺陷修复后的最终复跑
> vitest run
 RUN  v4.1.10 /mnt/tos/workspace/MyBrand
 Test Files  4 passed (4)
      Tests  33 passed (33)
   Duration  16.64s
TEST_EXIT=0
```
**total_tests=33 > 0,全绿。** 覆盖:状态过滤(含旧数据兜底)/cron 发布(到期/未来/失败隔离)/预览 token 三态/流转与鉴权输入校验(含 x-forwarded-host 伪造用例)/预览密钥派生降级。

## 阶段9 后终审复跑(2026-08-11 晚,最终代码 57c1f79)
```
scoped lint(21 文件): ✔ No ESLint warnings or errors   (exit 0)
npm run build:        ✓ Compiled successfully / ✓ Generating static pages (39/39)  (exit 0)
npm test:             Test Files 4 passed (4) / Tests 33 passed (33)  (exit 0)
```

## 环境噪声(诚实记录)
本沙箱对 node_modules 偶发 `EPERM: operation not permitted`(瞬时文件读失败),build/test 各遇到一次,重跑即过;非代码问题,最终输出均为全绿 run 的真实结果。

## 门禁结论
| 门禁 | 结果 |
|---|---|
| lint(改动文件) | ✅ exit 0(全量 lint 26 个历史遗留 error 另行治理,本次 0 命中) |
| build | ✅ exit 0,39/39 页面,8 条相关路由在册 |
| test | ✅ exit 0,4 文件 33/33 通过(32 → 33:阶段9 修复 previewToken 降级密钥后新增派生用例) |
