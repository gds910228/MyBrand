// 项目数据类型定义
export interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  slug: string;
  coverImage: string;
  technologies: string[];
  category: 'web' | 'mobile' | 'design';
  featured?: boolean;
  projectUrl?: string;
  githubUrl?: string;
  locale?: 'en' | 'zh';
}

// 中文项目数据
export const projectsDataZh: Project[] = [
  {
    id: "project-1",
    title: "电子商务平台",
    subtitle: "现代React电商网站",
    description: "一个功能齐全的电子商务平台，包括产品展示、购物车、结账流程和支付集成。使用React和Next.js构建，MongoDB提供数据存储，Stripe处理支付。",
    slug: "ecommerce-platform",
    coverImage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    technologies: ["React", "Next.js", "MongoDB", "Stripe", "Tailwind CSS"],
    category: "web",
    featured: true,
    projectUrl: "https://example.com",
    githubUrl: "https://github.com/example/ecommerce",
    locale: "zh"
  },
  {
    id: "project-2",
    title: "旅行探索应用",
    subtitle: "iOS和Android旅行助手",
    description: "一款帮助用户发现和规划旅行的跨平台移动应用。包括位置搜索、地图集成、行程规划和旅行提醒功能。使用React Native开发，Firebase提供后端服务。",
    slug: "travel-explorer-app",
    coverImage: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
    technologies: ["React Native", "Firebase", "Google Maps API", "Expo"],
    category: "mobile",
    featured: true,
    projectUrl: "https://example.com/travel-app",
    githubUrl: "https://github.com/example/travel-explorer",
    locale: "zh"
  },
  {
    id: "project-3",
    title: "任务管理系统",
    subtitle: "企业级项目管理工具",
    description: "一个综合性的任务管理系统，帮助团队跟踪项目进度、分配任务和管理资源。包括拖放界面、进度报告和团队协作功能。",
    slug: "task-management-system",
    coverImage: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80",
    technologies: ["Vue.js", "Node.js", "PostgreSQL", "Socket.io"],
    category: "web",
    projectUrl: "https://example.com/task-manager",
    locale: "zh"
  },
  {
    id: "project-4",
    title: "健康监测应用",
    subtitle: "个人健康追踪工具",
    description: "一款可与可穿戴设备集成的健康监测应用，用于追踪运动、睡眠和营养数据。提供个性化洞察和健康建议。",
    slug: "health-tracker-app",
    coverImage: "https://images.unsplash.com/photo-1576678927484-cc907957088c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    technologies: ["Flutter", "Firebase", "HealthKit", "Google Fit API"],
    category: "mobile",
    projectUrl: "https://example.com/health-app",
    locale: "zh"
  },
  {
    id: "project-5",
    title: "金融仪表板",
    subtitle: "个人财务分析工具",
    description: "一个交互式仪表板，提供个人财务数据的可视化和分析。整合多个银行账户和投资，提供支出趋势、预算工具和财务预测。",
    slug: "finance-dashboard",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    technologies: ["Angular", "D3.js", "Node.js", "MongoDB"],
    category: "web",
    locale: "zh"
  },
  {
    id: "project-6",
    title: "社交媒体UI设计",
    subtitle: "现代社交平台体验设计",
    description: "为社交媒体平台创建的全面UI/UX设计，包括用户流程、交互模式和视觉风格指南。专注于可用性、可访问性和用户参与度。",
    slug: "social-media-design",
    coverImage: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    technologies: ["Figma", "Adobe XD", "Prototyping", "User Research"],
    category: "design",
    locale: "zh"
  }
]; 

// 英文项目数据
export const projectsDataEn: Project[] = [
  {
    id: "project-1",
    title: "E-Commerce Platform",
    subtitle: "Modern React E-commerce Website",
    description: "A fully featured e-commerce platform including product displays, shopping cart, checkout flow and payment integration. Built with React and Next.js, using MongoDB for data storage and Stripe for payment processing.",
    slug: "ecommerce-platform",
    coverImage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    technologies: ["React", "Next.js", "MongoDB", "Stripe", "Tailwind CSS"],
    category: "web",
    featured: true,
    projectUrl: "https://example.com",
    githubUrl: "https://github.com/example/ecommerce",
    locale: "en"
  },
  {
    id: "project-2",
    title: "Travel Explorer App",
    subtitle: "iOS and Android Travel Companion",
    description: "A cross-platform mobile application that helps users discover and plan trips. Features include location search, map integration, itinerary planning, and travel reminders. Developed with React Native with Firebase backend services.",
    slug: "travel-explorer-app",
    coverImage: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
    technologies: ["React Native", "Firebase", "Google Maps API", "Expo"],
    category: "mobile",
    featured: true,
    projectUrl: "https://example.com/travel-app",
    githubUrl: "https://github.com/example/travel-explorer",
    locale: "en"
  },
  {
    id: "project-3",
    title: "Task Management System",
    subtitle: "Enterprise Project Management Tool",
    description: "A comprehensive task management system that helps teams track project progress, assign tasks, and manage resources. Includes drag-and-drop interface, progress reporting, and team collaboration features.",
    slug: "task-management-system",
    coverImage: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80",
    technologies: ["Vue.js", "Node.js", "PostgreSQL", "Socket.io"],
    category: "web",
    projectUrl: "https://example.com/task-manager",
    locale: "en"
  },
  {
    id: "project-4",
    title: "Health Tracker App",
    subtitle: "Personal Health Monitoring Tool",
    description: "A health monitoring application that integrates with wearable devices to track exercise, sleep, and nutrition data. Provides personalized insights and health recommendations.",
    slug: "health-tracker-app",
    coverImage: "https://images.unsplash.com/photo-1576678927484-cc907957088c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    technologies: ["Flutter", "Firebase", "HealthKit", "Google Fit API"],
    category: "mobile",
    projectUrl: "https://example.com/health-app",
    locale: "en"
  },
  {
    id: "project-5",
    title: "Finance Dashboard",
    subtitle: "Personal Finance Analytics Tool",
    description: "An interactive dashboard providing visualization and analysis of personal financial data. Integrates with multiple bank accounts and investments, offering spending trends, budgeting tools, and financial forecasting.",
    slug: "finance-dashboard",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    technologies: ["Angular", "D3.js", "Node.js", "MongoDB"],
    category: "web",
    locale: "en"
  },
  {
    id: "project-6",
    title: "Social Media UI Design",
    subtitle: "Modern Social Platform UX Design",
    description: "A comprehensive UI/UX design created for a social media platform, including user flows, interaction patterns, and visual style guides. Focus on usability, accessibility, and user engagement.",
    slug: "social-media-design",
    coverImage: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    technologies: ["Figma", "Adobe XD", "Prototyping", "User Research"],
    category: "design",
    locale: "en"
  }
];

// 为了保持兼容性，提供按语言获取项目数据的函数
export function getProjectsByLocale(locale: string = 'en') {
  return locale === 'zh' ? projectsDataZh : projectsDataEn;
}

// 导出项目数据（为了向后兼容）
export const projectsData = {
  en: projectsDataEn,
  zh: projectsDataZh
}; 