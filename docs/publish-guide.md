# 发布管线使用指南（feat-publish-pipeline）

一条命令/一个页面，把 Obsidian 图文 Markdown 变成配置完整的 Notion 博客帖子：图片自动上图床、AI 生成字段三件套、站点缓存自动刷新。**公众号侧流程不变**（继续用 Obsidian 生成的 HTML），但再也不需要"把公众号内容粘贴进 Notion"这个环节。

## 全流程

```
Obsidian 写 .md（frontmatter + 图文）
  → npm run blog:publish -- <post.md>   或   /admin/publish 网页
     ├─ 图片自动上传 GitHub 图床仓库 → jsDelivr 外链（Notion/站点/公众号三端共用）
     ├─ AI 一次生成: Blog 全字段 + 封面文生图提示词×3(16:9) + Twitter 推文(带站点外链)
     ├─ Markdown → 干净的 Notion blocks（站点排版由自己的渲染器控制,永不走样）
     ├─ 按 Slug+Language 幂等写入(重复执行=更新,不重复建页)
     └─ 自动刷新站点缓存;草稿输出 HMAC 预览链接
  → 草稿确认后到 /admin/content 切换 Published(或直接 --status published)
```

## 一次性准备

1. **图床仓库**：GitHub 新建一个**公开**仓库（如 `misotech-images`），不用初始化 README 也行。
2. **GitHub PAT**：https://github.com/settings/tokens 生成（classic token，勾 `repo` 权限）。
3. **GLM Key**：智谱开放平台获取。普通 Key 用默认端点；Coding Plan 套餐的 Key 端点为 `https://open.bigmodel.cn/api/coding/paas/v4`。
4. **环境变量**（本地 `.env.local` 与 Vercel 项目设置都要加）：

```bash
# 图床
GITHUB_TOKEN=github_pat_xxx
IMAGE_REPO=gds910228/misotech-images
IMAGE_BRANCH=main
# IMG_CDN_BASE 默认 https://cdn.jsdelivr.net/gh/<IMAGE_REPO>@<IMAGE_BRANCH>,换 COS/R2 时只改这里

# AI 三件套
AI_API_KEY=xxx
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_MODEL=glm-4.6
```

已有的 `NOTION_API_KEY`、`NOTION_BLOG_DATABASE_ID`、`REVALIDATE_SECRET`、`ADMIN_TOKEN`、`PREVIEW_TOKEN` 等沿用。

## Markdown 规范

frontmatter 全部可选（缺的由 AI 生成），写的优先级最高：

```markdown
---
title: 标题
slug: english-slug          # 小写英文短横线;缺省由 AI 翻译标题生成
language: Chinese           # Chinese | English
status: draft               # draft | scheduled | published(默认 draft)
publishDate: 2026-10-26
tags: AI图像生成, Midjourney, 工具评测   # 逗号分隔
cover: images/cover.png     # 本地引用(随帖上传)或完整 URL
summary: 摘要
author: Archer              # 可选;缺省用 env AUTHOR_NAME(Archer)
# 工具评测帖扩展(可选,不填则由 AI 对产品/平台/工具类文章强制生成)
ratingOverall: 4.8
ratingEaseOfUse: 4.2
ratingFeatures: 5.0
pros:
  - 优点一
  - 优点二
cons:
  - 缺点一
toolWebsite: https://www.midjourney.com/
toolPricing: 订阅 $10/月起
---

正文支持:标题(1-3级)、列表(嵌套自动拍平)、代码块、引用、**粗体**/*斜体*/`行内代码`/链接、
表格、分隔线、图片、YouTube 视频裸链接。

> [!note] Obsidian callout
> 会映射为 Notion callout,note/tip/warning/danger 等类型自动配 emoji。

![本地图片](attachments/demo.png)  ← 发布时自动上传图床并替换 URL
![[Obsidian wiki 嵌入]]           ← 同样支持
```

不支持（发布时告警并跳过）：原始 HTML、脚注、LaTeX 公式、公众号 mmbiz 防盗链图。

## CLI 用法

> **PowerShell 注意**：`npm run blog:publish -- xx.md --dry-run` 会丢选项（PowerShell 吞掉 `--` 后，npm 把 `--dry-run` 当作自己的参数消费），请用 `npx tsx` 直调形式。CMD/Git Bash 下两种写法都可以。

```bash
# PowerShell 推荐
npx tsx scripts/publish-post.ts "D:/ObsidianVault/Blog/my-post.md" --dry-run
npx tsx scripts/publish-post.ts my-post.md
npx tsx scripts/publish-post.ts my-post.md --status published --yes
npx tsx scripts/publish-post.ts my-post.md --status scheduled --schedule "2026-11-01 09:00"
npx tsx scripts/publish-post.ts my-post.md --no-ai
npx tsx scripts/publish-post.ts my-post.md --vault "D:/ObsidianVault"
# 正式发推前务必指定线上站点(否则推文外链是 localhost)
npx tsx scripts/publish-post.ts my-post.md --site https://www.misitebo.win
```

CLI 会读取 md 所在目录 + `--vault` 目录下的图片文件（含子目录），按文件名/相对路径与正文引用匹配。

## 网页端（/admin/publish）

1. 左侧粘贴 Markdown（或导入 .md 文件），多选上传图片文件；
2. 「解析」查看块转换结果与图片匹配情况；「AI 生成三件套」等待 30-60 秒；
3. 右侧字段表单核对/修改（AI 只回填空字段，不覆盖你改过的内容）；
4. 「发布到 Notion」→ 结果区给出 Notion 链接与草稿预览链接；
5. 封面提示词与推文卡片一键复制，拿去生图/发推。

注意：网页端走 Vercel 函数，**图片总量超过 4.5MB 会被拒**，大图先压缩；CLI 无此限制。

## 图片是怎么插进帖子的(重要)

三种方式,任选其一:

1. **标准图片语法**: `![说明](文件名.png)` 或 `![[文件名.png]]` — 文件名(或不含扩展名)与上传文件一致 → 自动上传图床并插入;
2. **配图占位约定**(公众号写作习惯): 正文整行写 `【配图1：三漏示意图】` → 自动转为图片位,上传名为 **配图1.png/jpg** 的文件即可插入,占位描述成为图片说明;未上传对应文件会告警且该行不显示;
3. 上传文件与正文引用**实时匹配标注**: 管理平台文件列表 ✅ 已匹配 / ⚠️ 未匹配,发布结果警告区列出每张被省略的图及原因。

不会插图的情况:引用是 `mmbiz.qpic.cn`(公众号防盗链,自动剔除并告警)。

图床外链上传后会做可访问性抽检——若提示不可访问,检查图床仓库是否为 **Public**(私有仓库 jsDelivr 无法服务,Notion/站点都会挂图)。

## 评测字段怎么填(以库中既有数据约定为准)

实测你库里的填法约定,管线与 AI 提示词已对齐:

| 字段 | 工具/产品评测文 | 方法论/经验文 |
| --- | --- | --- |
| Rating_*(三项评分) | AI 生成 0-5 分 | **留空**(AI 输出 0 分会被自动丢弃,表单不显示 0) |
| Pros / Cons | 工具优缺点 | **文章方法/做法的优缺点**(内容向评价,写入时自动补 "1. 2." 编号行) |
| Tool_Website | 官网 | 文中重点推荐/使用的工具或资源链接(有才填) |
| Tool_Pricing | 定价简述 | 通常留空 |
| ComparisonColumns / ComparisonData | 工具横向对比 | **模式/做法对照也可生成**(如"审批按钮模式 vs 三道防线") |

管理页"评测扩展字段"区全部可手工核对修改;对比表 JSON 留空 = 不写;优先级: 表单 > frontmatter > AI。

## 已自动填充的库属性

除正文外,管线按 Blog 库 schema 写入:Title/Slug/Language/Status/PublishDate/Summary/Tags/ReadingTime/**AuthorText(默认 Archer,env `AUTHOR_NAME` 或 frontmatter `author` 覆盖)**/**ButtonAllUpdate(默认 `${站点}/api/revalidate?secret=<REVALIDATE_SECRET>`,可用 env `BUTTON_ALL_UPDATE_URL` 覆盖)**/CoverImage(封面);评测类文章由 AI 生成 Rating_*/Pros/Cons/Tool_Website/Tool_Pricing/Comparison_*。

## 发布后

- **draft**:预览链接确认 → `/admin/content` 状态机切 Published(站点缓存自动刷新)。
  ⚠️ Notion 数据库视图若过滤了 `Status=Draft`,新草稿在视图里不可见——API 层面它**已在库里**,切视图筛选或到 `/admin/content` 看。`app.notion.com/p/...` 形式的链接就是数据库行的新版 URL。
- **scheduled**:Vercel Cron(每小时)到点自动发布,`/admin/content` 可查看/调整。
- **published**:直接上线,管线已自动调用 revalidate 刷新首页/列表/详情/sitemap。

## 双语

一个 slug 一份内容一种语言（`language` 字段区分）。双语帖 = 两份 md 用同一个 slug 分别发布。

## 图床风险与切换

jsDelivr 国内可访问性有波动（URL 生成集中在 `IMG_CDN_BASE` 一处）。如需切换：

1. 腾讯云 COS/R2 建桶并上传同路径图片，或直接改 `IMG_CDN_BASE` 指向新 CDN 域名；
2. `next.config.js` remotePatterns 与 `src/services/notion.ts` `validateImageUrl` 增加/替换 host；
3. 历史帖图片引用的是旧域名——Notion 里批量替换或重新发布该帖（幂等更新会重写 blocks）。
