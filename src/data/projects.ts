/**
 * 项目本地兜底层（feat-search-discovery-20260928）。
 *
 * 背景：`src/data/` 是本项目约定的「Notion 不可用时的本地兜底」层（见 .harness/rules/工程结构.md），
 * 但项目域此前**没有**任何 fallback——空 NOTION_API_KEY 下 `getAllProjects()` 直接返回 `[]`，
 * 导致站内搜索索引里没有任何 project 文档、项目列表页与详情页全部 404。
 *
 * 本文件遵循 `src/data/blog.ts` 既有模式补齐：
 * - 双语字段一律用 `{ en, zh }` 对象承载，由适配层（`src/data/localContent.ts`）按请求语言展平；
 * - `technologies` 对应 Notion 的 multi_select，进入搜索索引后作为 `keywords` 字段；
 * - 不引入任何新类型定义，形状与 `getAllProjects()` 的返回项对齐。
 */

export interface ProjectType {
  id: string;
  title: {
    en: string;
    zh: string;
  };
  subtitle: {
    en: string;
    zh: string;
  };
  description: {
    en: string;
    zh: string;
  };
  /** 是否为精选项目（对应 Notion Featured checkbox）。 */
  featured?: boolean;
  coverImage: string;
  /** 技术栈（对应 Notion Technologies multi_select）。 */
  technologies: string[];
  /** 项目分类（对应 Notion Category select）。 */
  category: string;
  role: {
    en: string;
    zh: string;
  };
  client: string;
  year: string;
  publishedAt: string;
  updatedAt?: string;
  projectUrl?: string;
  githubUrl?: string;
  slug: string;
  /** 项目正文（HTML 片段；适配层转成 Notion 形状 block）。 */
  content?: {
    en: string;
    zh: string;
  };
}

// 项目数据
export const projects: ProjectType[] = [
  {
    id: 'proj-1',
    title: {
      en: 'MisoTech Portfolio Platform',
      zh: 'MisoTech 作品集平台',
    },
    subtitle: {
      en: 'A bilingual portfolio and blog powered by Notion as a headless CMS',
      zh: '以 Notion 为无头 CMS 的双语作品集与博客平台',
    },
    description: {
      en: 'A production portfolio site built with Next.js 14 App Router, using Notion as a headless CMS for projects, blog posts and comments. Ships bilingual EN/ZH routing, ISR caching, incremental revalidation and full-text site search.',
      zh: '使用 Next.js 14 App Router 构建的生产级作品集站点，以 Notion 作为项目、博客与评论的无头 CMS。具备 EN/ZH 双语路由、ISR 缓存、增量再验证与全站全文检索能力。',
    },
    featured: true,
    coverImage:
      'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1170&q=80',
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Notion API'],
    category: 'webdev',
    role: {
      en: 'Lead Developer',
      zh: '主导开发者',
    },
    client: 'MisoTech',
    year: '2024',
    publishedAt: '2024-03-18',
    updatedAt: '2024-08-02',
    githubUrl: 'https://github.com/example/misotech-portfolio',
    slug: 'misotech-portfolio-platform',
    content: {
      en: '<h2>Overview</h2><p>The platform turns a Notion workspace into a fully featured bilingual website: content editors write in Notion, and the site renders it with ISR so updates appear within minutes without a redeploy.</p><h2>Architecture</h2><p>Server components fetch through a service layer that caches Notion responses and falls back to local seed data when the API is unavailable. Search runs on a MiniSearch index built from list metadata, so no extra Notion round trips are needed.</p><ul><li>App Router with route-level ISR</li><li>Locale-aware data adapters for EN and ZH</li><li>Graceful degradation to local fallback data</li></ul>',
      zh: '<h2>项目概述</h2><p>该平台把 Notion 工作区变成了功能完整的双语网站：编辑在 Notion 中写作，站点通过 ISR 渲染，内容更新可在数分钟内生效而无需重新部署。</p><h2>架构设计</h2><p>服务端组件经服务层获取数据，服务层缓存 Notion 响应，并在 API 不可用时回落本地种子数据。搜索基于列表元数据构建的 MiniSearch 索引，无需额外的 Notion 往返请求。</p><ul><li>App Router 与路由级 ISR</li><li>面向 EN 与 ZH 的语言感知数据适配层</li><li>降级到本地兜底数据的优雅容错</li></ul>',
    },
  },
  {
    id: 'proj-2',
    title: {
      en: 'Realtime Analytics Dashboard',
      zh: '实时分析仪表盘',
    },
    subtitle: {
      en: 'Streaming product metrics with sub-second update latency',
      zh: '亚秒级更新延迟的流式产品指标看板',
    },
    description: {
      en: 'A realtime dashboard that streams product telemetry over WebSocket and renders interactive charts. Built for teams that need to watch funnel health during a launch without refreshing the page.',
      zh: '通过 WebSocket 流式传输产品遥测数据并渲染交互式图表的实时仪表盘。为需要在发布期间持续观察漏斗健康度而无需刷新页面的团队打造。',
    },
    featured: true,
    coverImage:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1170&q=80',
    technologies: ['React', 'TypeScript', 'WebSocket', 'D3.js'],
    category: 'webdev',
    role: {
      en: 'Frontend Engineer',
      zh: '前端工程师',
    },
    client: 'Internal',
    year: '2024',
    publishedAt: '2024-05-09',
    githubUrl: 'https://github.com/example/realtime-analytics-dashboard',
    slug: 'realtime-analytics-dashboard',
    content: {
      en: '<h2>Overview</h2><p>The dashboard consumes a WebSocket feed and keeps a rolling window of events in memory, so charts update without a network round trip per render.</p><h2>Rendering</h2><p>Charts are drawn with D3 against a React-managed SVG tree. Rendering work is batched on animation frames to keep the main thread responsive under high event volume.</p>',
      zh: '<h2>项目概述</h2><p>仪表盘消费 WebSocket 数据流并在内存中维护滚动事件窗口，因此图表更新无需为每次渲染发起网络请求。</p><h2>渲染实现</h2><p>图表使用 D3 基于 React 管理的 SVG 树绘制。渲染工作按动画帧批处理，在高事件量下保持主线程响应。</p>',
    },
  },
  {
    id: 'proj-3',
    title: {
      en: 'E-Commerce Microservices',
      zh: '电商微服务架构',
    },
    subtitle: {
      en: 'Containerised order, inventory and payment services',
      zh: '容器化的订单、库存与支付服务',
    },
    description: {
      en: 'A microservices backend for e-commerce, split into order, inventory and payment services. Each service is containerised with Docker and orchestrated on Kubernetes, sharing a PostgreSQL cluster with per-service schemas.',
      zh: '面向电商的微服务后端，拆分为订单、库存与支付服务。每个服务使用 Docker 容器化并在 Kubernetes 上编排，共享 PostgreSQL 集群并按服务划分 schema。',
    },
    featured: false,
    coverImage:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1170&q=80',
    technologies: ['Node.js', 'Docker', 'Kubernetes', 'PostgreSQL'],
    category: 'backend',
    role: {
      en: 'Backend Engineer',
      zh: '后端工程师',
    },
    client: 'Retail Client',
    year: '2023',
    publishedAt: '2023-11-27',
    githubUrl: 'https://github.com/example/ecommerce-microservices',
    slug: 'ecommerce-microservices',
    content: {
      en: '<h2>Overview</h2><p>Order, inventory and payment are separate deployables so that a spike in checkout traffic does not starve inventory sync. Services communicate over an internal queue with idempotent consumers.</p><h2>Deployment</h2><p>Every service ships as a Docker image built in CI. Kubernetes handles rolling updates and horizontal scaling; PostgreSQL runs as a managed cluster with one schema per service.</p><ul><li>Docker images built per service</li><li>Kubernetes rolling deployments</li><li>Idempotent queue consumers</li></ul>',
      zh: '<h2>项目概述</h2><p>订单、库存与支付是彼此独立的可部署单元，因此结账流量激增不会拖垮库存同步。服务之间通过内部队列通信，消费端保证幂等。</p><h2>部署方式</h2><p>每个服务在 CI 中构建为 Docker 镜像。Kubernetes 负责滚动更新与水平扩缩；PostgreSQL 以托管集群运行，每个服务一个 schema。</p><ul><li>按服务构建 Docker 镜像</li><li>Kubernetes 滚动发布</li><li>幂等的队列消费者</li></ul>',
    },
  },
  {
    id: 'proj-4',
    title: {
      en: 'AI Content Summarizer',
      zh: 'AI 内容摘要器',
    },
    subtitle: {
      en: 'Turn long-form articles into structured summaries',
      zh: '把长篇文章转换为结构化摘要',
    },
    description: {
      en: 'A service that ingests long-form articles and returns structured summaries with key points and action items. Runs as a FastAPI application, packaged with Docker, and calls a language model through a provider-agnostic adapter.',
      zh: '接收长篇文章并返回结构化摘要（含要点与行动项）的服务。以 FastAPI 应用运行，使用 Docker 打包，并通过与供应商无关的适配层调用语言模型。',
    },
    featured: false,
    coverImage:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1170&q=80',
    technologies: ['Python', 'FastAPI', 'Docker', 'LLM'],
    category: 'ai',
    role: {
      en: 'ML Engineer',
      zh: '机器学习工程师',
    },
    client: 'Media Client',
    year: '2024',
    publishedAt: '2024-01-22',
    githubUrl: 'https://github.com/example/ai-content-summarizer',
    slug: 'ai-content-summarizer',
    content: {
      en: '<h2>Overview</h2><p>The summarizer splits input into overlapping chunks, summarises each chunk, then merges the partial summaries into a final structured output. Chunk overlap keeps sentences that straddle a boundary from being lost.</p><h2>Operations</h2><p>The service is packaged as a Docker image and scales horizontally behind a queue. Model calls are retried with exponential backoff, and every response is cached by content hash to avoid paying twice for the same article.</p>',
      zh: '<h2>项目概述</h2><p>摘要器将输入切分为带重叠的片段，逐段摘要后再把局部摘要合并为最终的结构化输出。片段重叠可避免跨边界的句子被截断丢失。</p><h2>运维实践</h2><p>服务打包为 Docker 镜像，在队列之后水平扩展。模型调用采用指数退避重试，所有响应按内容哈希缓存，避免同一篇文章重复计费。</p>',
    },
  },
  {
    id: 'proj-5',
    title: {
      en: 'Cross-Platform Fitness App',
      zh: '跨平台健身应用',
    },
    subtitle: {
      en: 'One codebase for iOS and Android training plans',
      zh: '一套代码覆盖 iOS 与 Android 的训练计划',
    },
    description: {
      en: 'A mobile fitness application sharing one TypeScript codebase across iOS and Android. Training plans sync through a GraphQL API so a workout started on a phone continues on a tablet.',
      zh: '一套 TypeScript 代码同时运行于 iOS 与 Android 的移动健身应用。训练计划通过 GraphQL API 同步，因此在手机上开始的训练可以在平板上继续。',
    },
    featured: false,
    coverImage:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1170&q=80',
    technologies: ['React Native', 'TypeScript', 'GraphQL'],
    category: 'mobile',
    role: {
      en: 'Mobile Developer',
      zh: '移动端开发者',
    },
    client: 'Fitness Startup',
    year: '2023',
    publishedAt: '2023-08-14',
    slug: 'cross-platform-fitness-app',
    content: {
      en: '<h2>Overview</h2><p>Shared business logic lives in a platform-neutral package, while rendering and gesture handling stay platform-specific. This keeps the sync layer identical on both platforms.</p><h2>Data flow</h2><p>Training plans are fetched and mutated through GraphQL. Optimistic updates keep the UI responsive on flaky mobile networks, with a reconciliation pass once the server responds.</p>',
      zh: '<h2>项目概述</h2><p>共享业务逻辑位于与平台无关的包中，渲染与手势处理则保持平台特定实现。这让同步层在两个平台上完全一致。</p><h2>数据流</h2><p>训练计划通过 GraphQL 读取与修改。乐观更新让 UI 在不稳定的移动网络下依然流畅，服务端响应后再做一次对账。</p>',
    },
  },
  {
    id: 'proj-6',
    title: {
      en: 'Design System Component Library',
      zh: '设计系统组件库',
    },
    subtitle: {
      en: 'Accessible React components documented in Storybook',
      zh: '在 Storybook 中沉淀文档的无障碍 React 组件库',
    },
    description: {
      en: 'A component library that keeps product surfaces visually consistent. Every component ships with accessibility notes, keyboard behaviour and visual regression coverage, documented in Storybook and sourced from Figma tokens.',
      zh: '保持各产品界面视觉一致性的组件库。每个组件都附带无障碍说明、键盘行为与视觉回归覆盖，在 Storybook 中沉淀文档，设计变量源自 Figma。',
    },
    featured: false,
    coverImage:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1170&q=80',
    technologies: ['React', 'Storybook', 'Tailwind CSS', 'Figma'],
    category: 'design',
    role: {
      en: 'Design Engineer',
      zh: '设计工程师',
    },
    client: 'Product Team',
    year: '2022',
    publishedAt: '2022-09-30',
    githubUrl: 'https://github.com/example/design-system',
    slug: 'design-system-component-library',
    content: {
      en: '<h2>Overview</h2><p>The library encodes design decisions as code so that spacing, colour and typography cannot drift between teams. Design tokens are generated from Figma variables and consumed as Tailwind theme values.</p><h2>Quality gates</h2><p>Each component includes keyboard interaction tests and a visual regression snapshot. Accessibility is checked automatically in CI, and any violation fails the build.</p><ul><li>Design tokens generated from Figma</li><li>Keyboard interaction tests per component</li><li>Automated accessibility checks in CI</li></ul>',
      zh: '<h2>项目概述</h2><p>组件库把设计决策固化为代码，使间距、色彩与排版不会在团队之间发生漂移。设计变量由 Figma 变量生成，并作为 Tailwind 主题值消费。</p><h2>质量门禁</h2><p>每个组件都包含键盘交互测试与视觉回归快照。无障碍检查在 CI 中自动执行，任何违规都会导致构建失败。</p><ul><li>设计变量由 Figma 生成</li><li>每个组件的键盘交互测试</li><li>CI 中的自动化无障碍检查</li></ul>',
    },
  },
];
