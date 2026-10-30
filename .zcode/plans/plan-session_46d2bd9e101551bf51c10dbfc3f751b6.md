# 发布管线：Obsidian Markdown → Notion 一键发布（含 AI 字段三件套）

## 背景与诊断

三个痛点的根源：① 手动在 Notion 逐字段维护 + 另开 AI 生成字段 → 缺自动建页管线；② 公众号富文本粘贴进 Notion 被剥样式 → 应由 Markdown 机器生成干净的 Notion blocks（站点排版由自己的 NotionRenderer 控制，天然稳定）；③ 公众号 mmbiz 防盗链图在 Notion/站点都不显示 → 引入自有 GitHub 图床，三端共用稳定 URL。

新流程（替代现有全部手工环节）：

```
Obsidian 写 .md（frontmatter + 图文）
  → npm run publish <文件>（或 /admin/publish 网页）
     ├─ 图片自动上传 GitHub 图床仓库，md 内 URL 重写为 jsDelivr 外链
     ├─ AI(GLM) 一次生成三件套：Blog 全字段 JSON / 封面文生图提示词×3(16:9) / Twitter 推文(带站点外链)
     ├─ Markdown → Notion blocks（仅生成渲染器支持的类型 + 新增 table 支持）
     ├─ 按 Slug+Language 幂等写入博客数据库（存在则更新属性+替换正文，不重复建页）
     └─ 触发站点 revalidate + 输出 Notion 链接/草稿预览链接（HMAC 预览已有）
  → 草稿在 /admin/content 确认发布（状态机已有）；公众号 HTML 继续沿用现有 Obsidian 流程
```

公众号帖子内容粘贴进 Notion 的环节彻底消失；Twitter 推文不再需要回 Gemini 手跑提示词。

## Phase 1：核心管线库 + CLI（本地闭环）

新增依赖：`remark-parse`/`remark-gfm`/`unified`（mdast 解析，含表格）、`gray-matter`（frontmatter）、`tsx`（devDep，CLI 跑 TS）。AI/GitHub 上传用原生 fetch，不加 SDK。

1. **`src/lib/publish/parseMarkdown.ts`** — gray-matter 解析 frontmatter（title/slug/language/status/publishDate/tags/cover/...）；mdast 遍历提取图片引用（Obsidian `![[xx.png]]` wiki 语法 + 标准 `![](...)` 相对路径），返回正文 AST + 图片清单 + 警告（不支持的语法列表）。
2. **`src/lib/publish/imageHost.ts`** — GitHub Contents API（PUT base64）上传图片到图床仓库（env：`GITHUB_TOKEN`、`IMAGE_REPO`，建议新建独立公开仓库如 misotech-images），路径 `images/<slug>/<hash>-<name>`；已存在且内容 hash 相同则跳过（幂等）。外链 URL 统一由 `IMG_CDN_BASE`（默认 `https://cdn.jsdelivr.net/gh/<repo>@main`）拼接——**URL 生成集中此一处，未来换 COS/R2 只改配置**。
3. **`src/lib/publish/markdownToNotion.ts`** — mdast → Notion blocks，目标类型对齐 `NotionRenderer.tsx:56-240`：paragraph、heading_1/2/3、bulleted/numbered_list_item（嵌套拍平）、code、quote、image（external URL）、divider、video/embed（链接）、**callout（Obsidian `> [!note]` 语法映射，icon 取对应 emoji）**；inline 覆盖 bold/italic/strike/underline/inline-code/link。**同时给 NotionRenderer.tsx 新增 table 块渲染**（表格是评测帖刚需，当前 default 分支直接丢弃）。
4. **`src/lib/publish/aiFields.ts`** — 调 GLM OpenAI 兼容端点（env：`AI_API_KEY`、`AI_BASE_URL` 默认 open.bigmodel.cn/api/paas/v4、`AI_MODEL` 默认 glm-4.6，兼容任意 OpenAI 端点）。**把用户现有 Gemini 提示词模板固化**（存为 `src/lib/publish/prompts.ts`，可维护），一次调用输出 JSON：Blog 全字段（Title/Language/Status/PublishDate/Summary/Tags/Slug/Rating_*/Pros/Cons/Tool_Website/Tool_Pricing/ComparisonColumns/ComparisonData，严格按 `src/services/notion.ts:626-700` 的属性契约）+ 3 段 16:9 文生图提示词 + Twitter 推文（末尾附 `https://www.misitebo.win/zh/blog/<slug>`）。带 JSON schema 校验与失败重试。
5. **`src/lib/publish/publishPost.ts`** — 编排 1-4：属性映射复用 `scripts/import-blog-posts.js` 的 schema 探测逻辑（只写库里存在的字段）；幂等 upsert：按 `Slug+Language` 查重 → 无则 `pages.create`（含 children），有则 `pages.update` 属性 + 拉旧正文块逐个 archive 后 append 新 blocks（CLI 交互确认"将覆盖旧正文"）；发布后调用 `revalidateBlogPaths`（`src/services/revalidate.ts:37` 已有）。
6. **`scripts/publish-post.ts`** + package.json `"publish": "tsx scripts/publish-post.ts"` — 参数：`<md路径>`、`--dry-run`（只打印块数/字段/图清单）、`--status draft|published`（默认 draft）、`--schedule "2026-11-01 09:00"`（写 scheduledAt+Status=Scheduled，走已有 cron 发布）、`--no-ai`（跳过 AI 手填字段）。输出：Notion 链接、站点预览链接、封面提示词、推文（一键复制到剪贴板）。
7. **配置同步** — `next.config.js` remotePatterns 与 `src/services/notion.ts:30-54` `validateImageUrl` 白名单均新增 `cdn.jsdelivr.net` + `raw.githubusercontent.com`（备用源）；`.env.local.example` 增补全部新变量及注释。
8. **测试（vitest，遵循项目现有 ~24 套件惯例）** — markdownToNotion 各块型映射、frontmatter 解析、AI JSON 校验器、属性映射探测逻辑。

## Phase 2：`/admin/publish` 后台发布页

1. **API** — `src/app/api/admin/publish/parse/route.ts`（POST md 文本 → 解析预览 + 触发 AI 三件套，不落库）、`.../publish/route.ts`（POST 确认后的字段+图片 → 上传图床 + upsert Notion + revalidate），均复用 `src/lib/adminAuth.ts` 的 ADMIN_TOKEN 鉴权。
2. **页面** — `src/app/admin/publish/page.tsx`，复用 `src/app/admin/content/page.tsx` 骨架（token 登录 sessionStorage、中英切换、表单风格）：左侧粘贴/上传 md（+多选图片文件，按文件名与 md 引用匹配）；右侧字段表单可编辑，「AI 生成」按钮填充；下方三个产物卡片：Notion 字段确认、封面提示词（一键复制）、Twitter 推文（一键复制）；发布后展示 Notion 链接 + 站点预览链接。

## 不做的事（明确出范围）

- 不迁移 WordPress / 不改 Notion 为 Git 内容源；不动现有 `/admin/content` 状态机、cron、预览、评论、搜索。
- 公众号 HTML 不进 v1 管线（沿用现有 Obsidian 生成流程；后续可在同一份 Markdown 上加 `markdownToWechatHtml` 一键复制，属自然扩展）。
- 公众号 API 自动发布（个人订阅号无权限，粘贴 HTML 已够用）。

## 验收标准

- `npm run publish <md>` 一条命令完成：图上传 → AI 三件套（可确认）→ Notion 页面字段全、格式正确、图片为稳定外链 → 站点 revalidate → 输出全部链接与文案；重复执行=更新不重复建。
- 站点渲染：标题/列表/代码/引用/callout/**表格**/图片全部正常，排版与手写 Notion 帖一致；图不再出现"Notion 显示不了"。
- `/admin/publish` 网页端不依赖本地环境可完成同样发布；草稿可预览、可进状态机定时发布。
- 新增 vitest 全绿，`npm run build` 通过。