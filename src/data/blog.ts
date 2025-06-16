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
  }
]; 