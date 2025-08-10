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
]; 