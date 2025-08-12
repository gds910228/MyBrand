## To Do
- [ ] FeaturedProjects 组件：是否也需要展示 Role、Client、GitHub 链接（如需要我再同步）
- [ ] （可选）项目卡片补充显示 Year / Category
- [ ] （可选）详情页添加 Client 官网链接按钮（若 Notion 中提供）

## Doing
- [ ] 无

## Done
- [x] Notion 服务 getAllProjects 返回补充 client 字段，供列表展示
- [x] ProjectCard 支持 role / client / githubUrl，并在卡片底部轻量展示（GitHub 为图标链接）
- [x] 英文/中文项目列表页为 ProjectCard 透传 role、client、githubUrl
- [x] 英文详情页：Hero 副标题改为 description（项目概览）；新增 Role / Client / Year 元信息；正文移除重复“Project Overview”段并增加 Responsibilities 列表（若有）
- [x] 中文详情页：同英文页一致的改动（副标题、元信息、职责列表）
- [x] 完成 Role、Responsibilities、GitHubUrl、Client 的合理展示（Responsibilities 仅在详情页显示）