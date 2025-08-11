## To Do
- [ ] **Phase 1: Backend & Data Structure**
  - [ ] 在 Notion 中创建新的“文章”数据库 (用户操作)
    - [ ] 添加字段: `Title`, `Language`, `Status`, `PublishDate`, `Summary`, `Tags`, `CoverImage`, `Slug`
    - [ ] 添加评测字段: `Rating_Overall`, `Rating_EaseOfUse`, `Rating_Features`, `Pros`, `Cons`, `Tool_Website`, `Tool_Pricing`
  - [x] 改造 Notion 服务 (`src/services/notion.ts`)
    - [x] 更新 API 调用，从新的 Database ID 读取数据（含回退父页面模式）
    - [x] 实现根据 `Language` 和 `Status` 过滤文章的逻辑
    - [x] 解析新的评测相关字段
  - [x] 页面接入（最小改动）
    - [x] 英文/中文列表页按语言读取
    - [x] 英文/中文详情页按语言读取
- [ ] **Phase 2: Frontend & UI/UX**
  - [ ] 设计并实现新的博客列表页 (`/blog`)
    - [x] 应用科技网格背景与玻璃面板（EN/ZH Hero）
    - [x] 标签玻璃胶囊 + 霓虹悬浮样式
    - [x] 卡片玻璃化 + 悬浮发光动效（group-hover）
    - [ ] 深色默认与新字体优化
    - [x] 标签筛选交互与选中态
    - [ ] 列表分页/排序（按 PublishDate）
  - [x] 设计并实现新的文章详情页 (`/blog/[slug]`)
    - [x] 渲染从 Notion 获取的文章正文内容 (Blocks)
    - [x] 集成评测组件
  - [x] 开发评测专用组件
    - [x] 评分组件 (Rating)
    - [x] 优缺点卡片 (Pros & Cons)
    - [x] 核心信息盒子 (Info Box)
- [ ] **Phase 3: Internationalization (i18n)**
  - [ ] 实现语言切换逻辑
  - [ ] 确保列表页和详情页能根据 URL (`/en/` or `/zh/`) 显示对应语言内容

## Doing
- [ ] Phase 2: 列表页科技风格视觉改造与交互细节（悬浮发光、网格纹理、深色默认）

## Done
- [x] 需求分析与方案设计
- [x] 创建 `blog-notionform` Git 分支
- [x] Phase 1: Notion Database 驱动的数据读取与语言过滤接入
