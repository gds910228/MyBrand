## To Do
- [ ] 验证封面显示（EN/ZH 列表与详情）三种来源
  - [ ] Notion 直链
  - [ ] 本地文件名映射（/public/images/covers）
  - [ ] 无封面默认占位（placeholder.svg）
- [ ] （可选）OG 图自动生成
- [ ] （可选）RSS Feed（/rss.xml）
- [ ] （可选）缓存策略优化（ISR/Edge）
- [ ] （可选）对比表组件（多工具横评）
- [ ] （可选）语言切换器同 slug 映射回退用例回归

## Doing
- [ ] （空）

## Done
- [x] 英文详情页：封面占位回退，始终渲染封面容器
- [x] 中文详情页：封面占位回退，始终渲染封面容器
- [x] 列表卡片 BlogCard：封面占位回退（placeholder.svg）
- [x] Notion Database 集成（语言/状态过滤、属性解析、封面解析）
- [x] SEO 基础：JSON-LD（BlogPosting/AggregateRating）、sitemap.ts、robots.ts
- [x] Next/Image 远程域名白名单与本地 filename 映射
- [x] 技术风格 UI 基础（深色优先、字体、玻璃拟物/霓虹悬浮）
- [x] 加载/错误边界与 60s 内存缓存