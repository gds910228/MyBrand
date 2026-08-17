# Spec Review v2 — 内容草稿/发布状态机 + 定时发布(第二轮复审)

- 评审日期:2026-08-11
- 评审对象(均为修订后最新版):
  - `.harness/changes/feat-content-state-machine-20260811/request_analysis/spec.md`
  - `.harness/changes/feat-content-state-machine-20260811/request_analysis/tasks.md`
- 基线:`spec_review_v1.md`(REJECTED,3 P1 + 6 P2),逐条核验修复情况
- 评审方式:打开 spec/tasks 对应段落原文核对,并复查 `src/services/notion.ts`(getBlogPostById catch→null)、`src/app/api/search*/route.ts`(revalidate=600)、EN/ZH 详情页(revalidate=300)等源码现状
- **结论:APPROVED**(v1 的 3 条 P1 在规范层均已实质修复;无未修复 P0/P1,无新引入 P0/P1;新发现 4 条 P2 记录后续处理,不阻塞进入编码)

---

## 一、v1 P1 逐条核验

### P1-1 状态变更后 ISR 刷新 —— 已修复 ✅

v1 问题:admin 手动 published→draft 路径无 revalidatePath,已缓存详情页最长 300s 继续公开服务,与 §3 验收「直接访问 404」矛盾。

修复证据(原文引用):

- spec §1.1:「**状态变更后的 ISR 刷新(P1 修复)**:详情页 `revalidate=300`,published→draft 后若不刷新,已缓存详情页最长 300s 仍可公开访问……因此:`POST /api/admin/content/status` 成功后必须调 `revalidateBlogPaths([slug])`(路由层组合,服务层保持 Notion 纯净)……两处均额外追加 `/sitemap.xml`」
- spec §1.4 status 路由:「成功后调 `revalidateBlogPaths([slug])` + `/sitemap.xml`(见 §1.1 P1 修复)」
- tasks T3.4 status/route.ts:「`setStatus` 成功后 `revalidateBlogPaths([slug])` + `revalidatePath('/sitemap.xml')`(修 spec_review_v1 P1-1)」
- v1 指出的「slug 需在写操作前查出」闭环方式:T2.2 `setStatus` 返回 `{ok:true; slug}`,「slug 取自 pages.update 响应(供路由层 revalidate)」——Notion `pages.update` 响应含 properties,无需额外一次查询,方案成立。
- 服务层/路由层职责一致:spec 明确「路由层组合,服务层保持 Notion 纯净」,T2.2 服务层只做失效列表缓存,T3.4 路由层做 revalidate,两处口径一致,无矛盾。

**schedule 变更不刷新的理由核验:成立。** `scheduledAt` 字段本身不决定可见性(可见性只由 status 决定,收口在 `getAllBlogPosts` 应用侧过滤);scheduled 文章无论 scheduledAt 为何值均不公开,published 文章挂 scheduledAt 也不影响公开读取路径。可见性翻转只发生在 cron 发布时刻,而 cron 每篇成功后有刷新(T3.2)。spec §1.1「schedule 变更不影响可见性,不刷新」与状态机语义自洽。

附带确认:cron 方向刷新(T3.2 `revalidateBlogPaths([slug])` + `/sitemap.xml`)与 §1.3 一致;sitemap 追加刷新呼应 v1 P2-2(见下节)。

### P1-2 本地降级判定钉死 Host 头 —— 已修复 ✅

v1 问题:localhost 判定未指定 host 来源,存在 `x-forwarded-host` 伪造实现风险。

修复证据(原文引用):

- spec §1.4:「`ADMIN_TOKEN` **未配置** → 仅当 `request.headers.get('host')`(**只读 Host 头,绝不读 `x-forwarded-host`** —— 后者可被客户端伪造,伪造后生产环境未配 token 即全网获得 admin 写权限)为 `localhost` / `127.0.0.1` / `[::1]`(**去端口比较**)时放行,并 `console.warn` 告警;否则 → 403」
- tasks T3.4:「未配→**仅 Host 头**(`request.headers.get('host')`,去端口,绝不读 x-forwarded-host)为 localhost/127.0.0.1/[::1] 放行 + `console.warn`,否则 403」

spec 与 tasks 逐字口径一致。v1 要求的伪造用例已落入 tasks T6.4:「adminAuth host 伪造用例(x-forwarded-host: localhost 不得放行)」。

伪造面复查(v1 复审任务点名核查的三类):
- **端口**:已钉「去端口比较」✅
- **IPv6**:已列 `[::1]` ✅
- **大小写**:未规定归一化。Host 头大小写不敏感,客户端可发 `LOCALHOST:3000`;若实现做精确小写匹配,`LOCALHOST` 会被**拒绝**——失败方向是安全的(fail-closed),不构成伪造面,仅可能误拒本地正当请求。不定级,实现时建议小写归一化后比较。

### P1-3 预览降级密钥改进程随机 —— 已修复(规范层)✅,残留措辞见新 P2-1

v1 问题:「内置开发密钥」若为源码常量,生产忘配 PREVIEW_TOKEN 时任何人可自签 token 窃取草稿全文。

修复证据(原文引用):

- spec §1.2:「**未配置 `PREVIEW_TOKEN` 时降级(P1 修复)**:使用**进程启动时生成的随机密钥**(`crypto.randomBytes(32)`,模块级常量,**非源码常量**——源码常量可被读库者伪造 token 窃取草稿全文),并在服务端控制台打印预览 URL + token……进程重启后旧 token 失效,本地场景可接受」
- tasks T1.2:「`getPreviewSecret(): string` — `PREVIEW_TOKEN || 进程级随机密钥`(模块加载时 `crypto.randomBytes(32)` 生成,**非源码常量**,防伪造;未配置时 console.warn 降级提示)」

§1.2 与 T1.2 一致,安全性论证(随机密钥不可伪造、本地 console 打印仍可用、重启失效可接受)成立。v1 建议的「production 未配置时醒目告警」以「未配置时 console.warn 降级提示」落实(T1.2),可接受。

**但** v1 修法要求「spec §1.2 与 T1.2/T3.1 同步修订」——T3.1 未同步,仍写「secret = `PREVIEW_TOKEN || 内置开发密钥`」;spec §4 环境变量表也仍写「降级:内置开发密钥签名」。实质密钥生成逻辑在 T1.2 `getPreviewSecret()`(已修对),残留为措辞不一致,定新 P2-1(见下),不构成 P1。

---

## 二、v1 P2 处置核验(对照 §6 修订记录)

### §6 声称「顺手修」的 5 条 —— 核验均属实

| v1 条目 | §6 声称 | 核验结果 |
|---|---|---|
| P2-4 cron 鉴权优先级 | Bearer 优先钉死(§1.3) | ✅ §1.3:「`Authorization: Bearer <CRON_SECRET>` **优先**,无 Bearer 时才看 `?secret=`;两者均缺/均错 → 401」;T3.2 同口径。admin 侧 401/403 语义也在 §1.4 钉死(已配不匹配→401,未配非本地→403)。 |
| P2-2(部分)sitemap | 纳入刷新范围(§1.3/§1.1) | ✅ §1.1「两处均额外追加 `/sitemap.xml`」、T3.2/T3.4 均含 `revalidatePath('/sitemap.xml')`。`revalidatePath` 对构建期静态 sitemap 的按需失效机制成立(on-demand ISR 标准用法)。搜索索引部分留作遗留(见下)。 |
| P2-3 token 走 query | admin GET 改 Authorization 头(§1.4) | ✅ §1.4:「token 走 `Authorization: Bearer <ADMIN_TOKEN>` 头(避免 query 出现在访问日志)」;T3.4 同。POST 仍走 body token(body 不进访问日志,泄露面与 query 不同),可接受。 |
| P2-6a 错误码 | `scheduledAt-field-missing` 大小写统一(§1.1) | ✅(spec 侧)§1.1:「字段不存在时返回 `{ok:false, error:'scheduledAt-field-missing'}`」。**但 tasks T2.2 仍未携带该稳定错误码**,只写「字段不存在等 Notion 400 → `{ok:false, error}` 不抛」——修复不完整,并入新 P2-4。 |
| P2-6b 预览 404/502 | 预览 404/500 语义钉死(§1.2) | ✅(spec 侧)§1.2:「id 不存在 → 404;Notion 调用异常 → 500」。**但实现机制有缺口**:源码实查 `getBlogPostById` catch 后 `return null`(notion.ts:1021-1024),路由层拿到 null 无法区分「不存在」与「Notion 异常」,T3.1 只写「为 null→404」,未交代 500 的判定机制。并入新 P2-3。 |

另外:v1 P2-5(TDD 名不副实)§6 未提及,但 tasks T6 标题已改为「单元测试(阶段5,A 路径)」,删去了「TDD:先写测试跑红」表述,T6.5 改为「测试暴露的任何实现缺陷走『红→修→绿』循环」,口径诚实——视为已静默修复 ✅。

### §6 声称「遗留」的 3 条 —— 核验均可接受

1. **limit 在应用侧过滤后可能返回少于 limit 的 published**(v1 P2-1):影响面限于 not-found 推荐位(limit 6/20),可接受 ✅。
2. **/api/search* 600s ISR 残留**(v1 P2-2 残余):源码实查 `revalidate = 600` 属实,最长 ~10 分钟标题/摘要残留(非全文),§6 明确接受并给下期方向,可接受 ✅。但 §3 验收措辞与之冲突,见新 P2-2。
3. **blogListCache 多实例不失效(60s TTL 自愈)**(v1 P2-6c):现状即有、影响面不扩大,可接受 ✅。§2「避免草稿泄露窗口」的绝对化表述未按 v1 建议弱化为「缩短」,措辞瑕疵,不单独定级。

---

## 三、新发现问题(均为 P2,无 P0/P1)

**新 P2-1 T3.1 与 spec §4 残留「内置开发密钥」措辞,与 §1.2/T1.2 的随机密钥口径矛盾**
- 锚点:tasks T3.1「secret = `PREVIEW_TOKEN || 内置开发密钥`,降级时 `console.warn` 提示」;spec §4 表「降级:内置开发密钥签名」;对照 §1.2/T1.2「进程启动时生成的随机密钥……非源码常量」。
- 风险:实现者若直接按 T3.1 字面写 `process.env.PREVIEW_TOKEN || '<常量>'`,v1 P1-3 回潮。依赖顺序 T1→T3 且 T1.2 签名 `getPreviewSecret()` 已钉对,故只定 P2。
- 修法:T3.1 改为「secret = `getPreviewSecret()`(T1.2)」;§4 表同步改为「进程随机密钥 + 控制台打印」。

**新 P2-2 §3 验收首条与已接受的搜索/ISR 残留窗口冲突,按字面执行会误判失败**
- 锚点:§3「Notion 中把某篇设为 `Draft` → ……搜索结果、`/sitemap.xml` 均不出现;直接访问……返回 404」;对照 §6 遗留「/api/search* 索引 600s ISR,下架后最长 ~10 分钟搜索残留(可接受)」及详情页 `revalidate=300`(直接改 Notion 不经 admin API 时无 revalidatePath,sitemap 为构建期缓存)。
- 影响:验收者按 §3 字面操作(尤其直接改 Notion),搜索/详情/sitemap 在 TTL 内仍有残留,会把预期行为误判为缺陷。v1 Recommendations #2 已建议补路径/时限限定,本轮未采纳。
- 修法:§3 首条改为「**通过 admin API/后台**设为 Draft → 列表/详情/sitemap 立即 404 或消失(搜索索引除外,最长 ~10 分钟 TTL 后消失);直接改 Notion → 经 /api/revalidate 或 TTL 后一致」。

**新 P2-3 预览「Notion 异常 → 500」在现有 `getBlogPostById` 下无实现机制**
- 锚点:spec §1.2「id 不存在 → 404;Notion 调用异常 → 500」;源码 `getBlogPostById` catch → `return null`(notion.ts:1021-1024);T3.1 仅「为 null→404」。
- 修法(二选一):a) T2.1 为预览新增不吞错误的按 id 查询(或给 `getBlogPostById` 加 throw 选项),路由 try/catch 区分 404/500;b) 若不愿动 notion.ts,§1.2 放弃 500 区分,统一 404 并在路由内 console.error 记录。编码前需选定。

**新 P2-4 T2.2 未携带 `scheduledAt-field-missing` 稳定错误码,§6 声称的「错误码统一」只修了一半**
- 锚点:spec §1.1「返回 `{ok:false, error:'scheduledAt-field-missing'}`」;T2.2 `setScheduledAt`「字段不存在等 Notion 400 → `{ok:false, error}` 不抛」——未点名稳定错误码,后台 UI 无法可靠识别「请先建 scheduledAt 字段」场景。
- 修法:T2.2 补「字段不存在 → `error: 'scheduledAt-field-missing'`(固定码)」。

---

## 四、最终结论与理由

**APPROVED,可进入编码阶段。**

理由:
1. v1 的 3 条 P1 全部在规范层(spec + tasks 签名)实质修复,且 spec 与 tasks 口径一致:P1-1 刷新路径闭合(admin 手动方向已补,cron 方向原有,slug 取自 pages.update 响应的方案可行,schedule 不刷新的理由经状态机语义核验成立);P1-2 Host 头来源、去端口、IPv6、伪造用例四项全部钉死;P1-3 随机密钥方案在 §1.2 与 T1.2 落地,安全论证成立。
2. v1 的 6 条 P2:5 条顺手修核验属实(其中 2 条 spec 侧修对、tasks 侧有残留,已转化为新 P2-3/P2-4),P2-5 静默修复,3 条遗留均有明确影响面分析与下期方向,接受合理。
3. 新发现 4 条均为 P2 级(措辞残留、验收口径、实现机制待选定、错误码未同步),不涉及 draft/scheduled 泄露面或鉴权绕过,不阻塞编码;建议在 T3 动工前随手修订 T3.1/§4/T2.2 三处措辞,并在编码前选定新 P2-3 的 a/b 方案。
4. 修订段落与 spec 其它部分及代码现状(revalidate=300/600、getAllBlogPosts 单口取数、无 NextIntlClientProvider)无新冲突;§1.4 的「路由层组合、服务层 Notion 纯净」职责划分在 T2.2/T3.4 间自洽。

---
*评审人:资深需求评审 reviewer(Next.js 14 / Notion CMS / ISR)。所有核验均打开 spec/tasks 原文与相关源码完成;spec_review_v1.md 未改动。*
