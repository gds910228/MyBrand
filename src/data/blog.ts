// 博客文章类别
export interface CategoryType {
  name: string;
  label: {
    en: string;
    zh: string;
  };
}

export const categories: CategoryType[] = [
  { 
    name: 'webdev', 
    label: {
      en: 'Web Development',
      zh: '网页开发'
    }
  },
  { 
    name: 'design', 
    label: {
      en: 'Design',
      zh: '设计'
    }
  },
  { 
    name: 'career', 
    label: {
      en: 'Career',
      zh: '职业发展'
    }
  },
  { 
    name: 'tutorial', 
    label: {
      en: 'Tutorials',
      zh: '教程'
    }
  },
  { 
    name: 'ai', 
    label: {
      en: 'Artificial Intelligence',
      zh: '人工智能'
    }
  },
];

// 博客文章类型
export interface BlogPostType {
  id: string;
  title: {
    en: string;
    zh: string;
  };
  excerpt: {
    en: string;
    zh: string;
  };
  content?: {
    en: string;
    zh: string;
  };
  coverImage: string;
  publishedAt: string;
  updatedAt?: string;
  categories: string[];
  slug: string;
  featured?: boolean;
  /**
   * 标签（feat-search-discovery-20260928 新增，可选）。
   * 对应 Notion 的 Tags multi_select，是搜索索引 keywords 字段的来源。
   * 既有文章未标注 tags 时，适配层回落使用 `categories`，故本字段纯增量、不破坏既有数据。
   */
  tags?: string[];
  /** 预计阅读时长（可选，双语）。Notion 侧为文本字段；本地种子显式标注。 */
  readTime?: {
    en: string;
    zh: string;
  };
}

// 博客文章数据
export const blogPosts: BlogPostType[] = [
  {
    id: 'post-1',
    title: {
      en: 'Getting Started with Next.js 14',
      zh: 'Next.js 14 入门指南'
    },
    excerpt: {
      en: 'Learn how to set up a new Next.js project, explore the App Router, and understand React Server Components.',
      zh: '学习如何设置新的Next.js项目，探索App Router，并理解React服务器组件。'
    },
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    publishedAt: '2023-10-25',
    categories: ['webdev', 'tutorial'],
    slug: 'getting-started-with-nextjs-14',
    featured: true
  },
  {
    id: 'post-7',
    title: {
      en: 'Integrating AI Features into Web Applications',
      zh: '在Web应用中集成AI功能'
    },
    excerpt: {
      en: 'A practical guide to incorporating AI capabilities into your web projects using modern JavaScript frameworks and APIs.',
      zh: '使用现代JavaScript框架和API将AI功能集成到Web项目中的实用指南。'
    },
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1332&q=80',
    publishedAt: '2024-06-15',
    categories: ['ai', 'webdev', 'tutorial'],
    slug: 'integrating-ai-features-into-web-applications',
    featured: true
  },
  {
    id: 'post-8',
    title: {
      en: 'AI-Powered Design Tools for Developers',
      zh: '面向开发者的AI设计工具'
    },
    excerpt: {
      en: 'Discover how AI design tools are transforming the workflow for developers who need to create visually appealing interfaces.',
      zh: '探索AI设计工具如何改变需要创建视觉吸引力界面的开发者的工作流程。'
    },
    coverImage: 'https://images.unsplash.com/photo-1664575198308-3959904fa430?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    publishedAt: '2024-06-10',
    categories: ['ai', 'design', 'webdev'],
    slug: 'ai-powered-design-tools-for-developers',
    featured: false
  },
  {
    id: 'post-9',
    title: {
      en: 'The Future of Development: AI Pair Programming',
      zh: '开发的未来：AI结对编程'
    },
    excerpt: {
      en: 'Exploring how AI pair programming tools are changing the way developers write code and what this means for the future of software development.',
      zh: '探索AI结对编程工具如何改变开发者编写代码的方式，以及这对软件开发的未来意味着什么。'
    },
    coverImage: 'https://images.unsplash.com/photo-1655720828018-edd2daec9349?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1332&q=80',
    publishedAt: '2024-06-05',
    categories: ['ai', 'career', 'webdev'],
    slug: 'future-of-development-ai-pair-programming',
    featured: false
  },
  {
    id: 'post-2',
    title: {
      en: 'Creating Responsive UI with Tailwind CSS',
      zh: '使用Tailwind CSS创建响应式用户界面'
    },
    excerpt: {
      en: 'Discover the power of utility-first CSS and build responsive designs without leaving your HTML.',
      zh: '探索实用优先CSS的强大功能，在不离开HTML的情况下构建响应式设计。'
    },
    coverImage: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1332&q=80',
    publishedAt: '2023-10-15',
    updatedAt: '2023-10-18',
    categories: ['webdev', 'design', 'tutorial'],
    slug: 'responsive-ui-with-tailwind-css',
    featured: true
  },
  {
    id: 'post-3',
    title: {
      en: 'UI/UX Design Principles for Developers',
      zh: '面向开发者的UI/UX设计原则'
    },
    excerpt: {
      en: 'Essential design principles that every developer should know to create better user experiences.',
      zh: '每个开发人员都应该了解的基本设计原则，以创造更好的用户体验。'
    },
    coverImage: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    publishedAt: '2023-10-05',
    categories: ['design', 'webdev'],
    slug: 'ui-ux-design-principles-for-developers'
  },
  {
    id: 'post-4',
    title: {
      en: 'Building a Career in Tech: My Journey',
      zh: '在科技行业发展职业：我的旅程'
    },
    excerpt: {
      en: 'Reflecting on my path from beginner to professional developer, with lessons learned along the way.',
      zh: '回顾我从初学者到专业开发者的道路，以及途中学到的经验教训。'
    },
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    publishedAt: '2023-09-28',
    categories: ['career'],
    slug: 'building-a-career-in-tech'
  },
  {
    id: 'post-5',
    title: {
      en: 'State Management in React: Context API vs. Redux',
      zh: 'React中的状态管理：Context API与Redux对比'
    },
    excerpt: {
      en: 'Comparing different approaches to manage state in React applications and when to use each one.',
      zh: '比较React应用程序中管理状态的不同方法，以及何时使用每种方法。'
    },
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    publishedAt: '2023-09-20',
    categories: ['webdev', 'tutorial'],
    slug: 'state-management-in-react'
  },
  {
    id: 'post-6',
    title: {
      en: 'The Art of Writing Clean Code',
      zh: '编写干净代码的艺术'
    },
    excerpt: {
      en: 'Principles and practices to write maintainable, readable, and efficient code that your future self will thank you for.',
      zh: '编写可维护、可读和高效代码的原则和实践，你未来的自己会感谢你。'
    },
    coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80',
    publishedAt: '2023-09-15',
    categories: ['webdev', 'career'],
    slug: 'art-of-writing-clean-code'
  },
  {
    id: 'post-test-image-video',
    title: {
      en: 'Test Image And Video - Media Rich Content Demo',
      zh: '测试图片和视频 - 富媒体内容演示'
    },
    excerpt: {
      en: 'A comprehensive demonstration of image and video embedding capabilities in our Next.js blog, showcasing responsive media handling and beautiful typography.',
      zh: '全面演示Next.js博客中的图片和视频嵌入功能，展示响应式媒体处理和精美排版。'
    },
    content: {
      en: `
        <h2>Welcome to Media-Rich Content</h2>
        <p>This is a test article to demonstrate the enhanced media capabilities of our Next.js blog. We've built a powerful content system that supports various media types with beautiful, responsive layouts.</p>
        
        <h3>🖼️ Image Gallery</h3>
        <p>Let's start with some stunning visuals. Notice how images are beautifully styled with rounded corners and hover effects:</p>
        
        <figure>
          <img src="https://images.unsplash.com/photo-1682686581551-867e0b208bd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80" alt="Beautiful landscape with mountains and lake" />
          <figcaption>A breathtaking landscape showcasing our responsive image handling</figcaption>
        </figure>
        
        <h3>🎥 Video Content</h3>
        <p>Videos are seamlessly integrated with proper aspect ratios and responsive containers:</p>
        
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
          <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                  title="Test Video" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen>
          </iframe>
        </div>
        
        <h3>📱 Responsive Design</h3>
        <p>All media content is fully responsive and looks great on all devices:</p>
        
        <ul>
          <li>Images scale proportionally on different screen sizes</li>
          <li>Videos maintain 16:9 aspect ratio across devices</li>
          <li>Touch-friendly controls for mobile users</li>
          <li>Optimized loading with lazy loading for images</li>
        </ul>
        
        <h3>🎨 Typography and Layout</h3>
        <p>The content is beautifully formatted with consistent spacing and typography. Blockquotes, code blocks, and lists all have consistent styling that adapts to light and dark modes.</p>
        
        <blockquote>
          "The beauty of this system is that you can focus on creating great content while the platform handles all the technical details."
        </blockquote>
        
        <p>This test article demonstrates how you can create rich, engaging content without worrying about the technical implementation. Simply write in Notion, and everything is automatically converted to a beautiful web experience.</p>
      `,
      zh: `
        <h2>欢迎来到富媒体内容世界</h2>
        <p>这是一篇测试文章，演示我们Next.js博客的增强媒体功能。我们构建了一个强大的内容系统，支持各种媒体类型，并提供美观、响应式的布局。</p>
        
        <h3>🖼️ 图片画廊</h3>
        <p>让我们从一些令人惊叹的视觉效果开始。注意图片是如何通过圆角和悬停效果进行精美样式化的：</p>
        
        <figure>
          <img src="https://images.unsplash.com/photo-1682686581551-867e0b208bd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80" alt="美丽的山水风景" />
          <figcaption>展示我们响应式图片处理的壮丽风景</figcaption>
        </figure>
        
        <h3>🎥 视频内容</h3>
        <p>视频通过适当的宽高比和响应式容器无缝集成：</p>
        
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
          <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                  title="测试视频" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen>
          </iframe>
        </div>
        
        <h3>📱 响应式设计</h3>
        <p>所有媒体内容都是完全响应式的，在所有设备上看起来都很棒：</p>
        
        <ul>
          <li>图片在不同屏幕尺寸上按比例缩放</li>
          <li>视频在所有设备上保持16:9宽高比</li>
          <li>为移动用户提供触摸友好的控制</li>
          <li>为图片优化加载，支持延迟加载</li>
        </ul>
        
        <h3>🎨 排版和布局</h3>
        <p>内容通过一致的间距和排版精美格式化。引用、代码块和列表都具有适应明暗模式的一致样式。</p>
        
        <blockquote>
          "这个系统的美妙之处在于，你可以专注于创造优秀的内容，而平台会处理所有技术细节。"
        </blockquote>
        
        <p>这篇测试文章演示了如何创建丰富、引人入胜的内容，而无需担心技术实现。只需在Notion中编写，所有内容都会自动转换为精美的网络体验。</p>
      `
    },
    coverImage: 'https://images.unsplash.com/photo-1551434678-e076c223a092?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
    publishedAt: '2024-07-21',
    updatedAt: '2024-07-21',
    categories: ['tutorial', 'design'],
    slug: 'test-image-and-video',
    featured: true
  }
,
  // ---------------------------------------------------------------------------
  // 以下 3 篇为 feat-search-discovery-20260928 新增（T03）。
  // 目的：为检索质量基准集提供中文非词头子串（渲染 / 性能优化）与英文关键词
  // （typescript generics）的确定性命中目标，并补齐双语正文。
  // 既有 10 篇种子保持不变（Rules：不删除 src/data fallback 数据）。
  // ---------------------------------------------------------------------------
  {
    id: 'post-10',
    title: {
      en: 'Server-Side Rendering vs Static Generation in Next.js',
      zh: 'Next.js 中的服务端渲染与静态生成'
    },
    excerpt: {
      en: 'When to render on the server and when to pre-render at build time. A practical comparison of SSR, SSG and ISR with the trade-offs that actually matter in production.',
      zh: '何时在服务端渲染、何时在构建期预渲染。对比 SSR、SSG 与 ISR，并给出生产环境中真正重要的取舍。'
    },
    content: {
      en: '<h2>Three rendering strategies</h2><p>Next.js gives you three ways to turn data into HTML: render on every request, pre-render once at build time, or pre-render and revalidate on a schedule. The right choice depends on how often the data changes and how much latency your users will tolerate.</p><h2>Server-side rendering</h2><p>Server-side rendering produces HTML per request. It is the right default when the page depends on the request itself, such as a personalised dashboard or anything behind authentication.</p><h2>Static generation and ISR</h2><p>Static generation pre-renders at build time and serves the result from a cache. Incremental static regeneration extends it by rebuilding individual pages in the background after a revalidation window, which is what this site uses for content pages.</p><ul><li>Use SSR for per-request data</li><li>Use SSG for content that rarely changes</li><li>Use ISR when content changes but not per request</li></ul><h2>Choosing in practice</h2><p>Start static. Move a route to server-side rendering only when you can point at a concrete requirement it fails to meet. Every route you keep static is a route that cannot fall over under load.</p>',
      zh: '<h2>三种渲染策略</h2><p>Next.js 提供三种把数据变成 HTML 的方式：每次请求都渲染、构建期预渲染一次，或预渲染后按周期再验证。正确选择取决于数据变化频率与用户可接受的延迟。</p><h2>服务端渲染</h2><p>服务端渲染按请求产出 HTML，适合页面依赖请求本身的场景，例如个性化仪表盘或任何需要登录的内容。</p><h2>静态生成与 ISR</h2><p>静态生成在构建期预渲染并从缓存提供结果。增量静态再生（ISR）在此基础上扩展：在再验证窗口过后于后台重建单个页面，本站的内容页正是采用这种方式。</p><ul><li>按请求取数用 SSR</li><li>极少变化的内容用 SSG</li><li>内容会变但不必按请求变化时用 ISR</li></ul><h2>实践中的选择</h2><p>先默认静态。只有当你能指出某个具体需求静态方案确实无法满足时，再把该路由改为服务端渲染。每保留一个静态路由，就少一个会在高负载下崩溃的路由。</p>'
    },
    coverImage: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=1170&q=80',
    publishedAt: '2024-05-20',
    categories: ['webdev', 'tutorial'],
    tags: ['nextjs', 'ssr', 'performance'],
    readTime: { en: '7 min read', zh: '7 分钟阅读' },
    slug: 'server-side-rendering-vs-static-generation',
    featured: true
  },
  {
    id: 'post-11',
    title: {
      en: 'A Practical Guide to TypeScript Generics',
      zh: 'TypeScript 泛型实用指南'
    },
    excerpt: {
      en: 'Generics stop being intimidating once you use them for one job: describing the relationship between inputs and outputs. A practical guide with real examples.',
      zh: '当你只把泛型用于一件事——描述输入与输出之间的关系——它就不再令人生畏。一份配有真实示例的实用指南。'
    },
    content: {
      en: '<h2>What generics are for</h2><p>A generic is a way to say these two types are the same, but I do not know which one yet. That is the whole idea. Everything else is syntax.</p><h2>Describing relationships</h2><p>Consider a function that takes an array and returns its first element. Without generics it must return a union or any. With a generic it returns exactly the element type of the array you passed in.</p><h2>Constraints</h2><p>Constraints let you require that a type has certain properties while still preserving the specific type. This is how you write a helper that reads an identifier without losing which model it came from.</p><ul><li>Use generics to link input and output types</li><li>Add constraints only when you need to access a property</li><li>Prefer a concrete type when a generic adds nothing</li></ul><h2>When not to use them</h2><p>If a type parameter appears only once in a signature, it is usually not doing any work. Reach for a concrete type instead and the code gets easier to read.</p>',
      zh: '<h2>泛型解决什么问题</h2><p>泛型是用来表达「这两个类型是同一个，但我还不知道是哪一个」的手段。核心思想仅此而已，其余都是语法。</p><h2>描述类型之间的关系</h2><p>以一个接收数组并返回首元素的函数为例。不用泛型，它只能返回联合类型或 any；用了泛型，它返回的正是你传入数组的元素类型。</p><h2>约束</h2><p>约束让你在保留具体类型的同时，要求该类型具备某些属性。这正是编写「读取标识符但不丢失其来源模型」这类辅助函数的方法。</p><ul><li>用泛型把输入类型与输出类型关联起来</li><li>只在需要访问属性时才加约束</li><li>泛型没有增益时就改用具体类型</li></ul><h2>什么时候不要用</h2><p>如果一个类型参数在签名中只出现一次，它通常没有起作用。此时改用具体类型，代码会更好读。</p>'
    },
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=1170&q=80',
    publishedAt: '2024-04-11',
    categories: ['webdev', 'tutorial'],
    tags: ['typescript', 'tutorial'],
    readTime: { en: '6 min read', zh: '6 分钟阅读' },
    slug: 'practical-guide-to-typescript-generics'
  },
  {
    id: 'post-12',
    title: {
      en: 'Performance Optimization for React Applications',
      zh: 'React 应用性能优化实战'
    },
    excerpt: {
      en: 'Most React performance work is not about memoisation. It is about finding which state update is causing a subtree to re-render, and moving that state down.',
      zh: '大多数 React 性能工作与记忆化无关，而是要找出是哪个状态更新导致子树重渲染，并把该状态下移。'
    },
    content: {
      en: '<h2>Measure before you optimise</h2><p>Open the profiler and record a slow interaction. Every optimisation you make without a measurement is a guess, and most guesses make the code harder to read without making it faster.</p><h2>The usual culprit</h2><p>By far the most common problem is state that lives too high in the tree. When a component high up holds state that only one leaf needs, every sibling re-renders on each update. Moving that state down usually removes the problem entirely.</p><h2>Memoisation, carefully</h2><p>Memoisation is a tool for when you cannot restructure the tree, not a default. Applied blindly it adds comparison cost and hides the real dependency graph from the next reader.</p><ul><li>Profile first, then optimise</li><li>Move state down before memoising</li><li>Split context so unrelated consumers do not re-render</li><li>Virtualise long lists rather than optimising each row</li></ul><h2>Where to stop</h2><p>Stop when the interaction feels instant. Further optimisation has a cost in complexity that will be paid by whoever reads the component next.</p>',
      zh: '<h2>先测量再优化</h2><p>打开性能分析器并录制一次卡顿交互。任何没有测量支撑的优化都只是猜测，而大多数猜测只会让代码更难读，并不会更快。</p><h2>最常见的原因</h2><p>最普遍的问题是状态放得过高。当高层组件持有只有某个叶子节点需要的状态时，每次更新都会让所有兄弟节点重渲染。把状态下移通常能彻底解决问题。</p><h2>谨慎使用记忆化</h2><p>记忆化适用于无法调整组件树的场景，而不是默认选项。盲目套用会增加比较开销，并向下一个读者隐藏真实的依赖关系。</p><ul><li>先做性能分析，再谈优化</li><li>优先下移状态，而非记忆化</li><li>拆分 Context，避免无关消费者重渲染</li><li>长列表做虚拟化，而不是逐行优化</li></ul><h2>何时收手</h2><p>当交互感觉即时就应停止。继续优化所带来的复杂度成本，将由下一个读这段代码的人承担。</p>'
    },
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1170&q=80',
    publishedAt: '2024-07-08',
    categories: ['webdev', 'ai'],
    tags: ['react', 'performance', 'optimization'],
    readTime: { en: '8 min read', zh: '8 分钟阅读' },
    slug: 'performance-optimization-for-react-applications',
    featured: true
  }
]; 