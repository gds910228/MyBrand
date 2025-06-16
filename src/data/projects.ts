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
}

// 项目数据
export const projectsData: Project[] = [
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
    githubUrl: "https://github.com/example/ecommerce"
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
    githubUrl: "https://github.com/example/travel-explorer"
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
    projectUrl: "https://example.com/task-manager"
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
    projectUrl: "https://example.com/health-app"
  },
  {
    id: "project-5",
    title: "金融仪表板",
    subtitle: "个人财务分析工具",
    description: "一个交互式仪表板，提供个人财务数据的可视化和分析。整合多个银行账户和投资，提供支出趋势、预算工具和财务预测。",
    slug: "finance-dashboard",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    technologies: ["Angular", "D3.js", "Node.js", "MongoDB"],
    category: "web"
  },
  {
    id: "project-6",
    title: "社交媒体UI设计",
    subtitle: "现代社交平台体验设计",
    description: "为社交媒体平台创建的全面UI/UX设计，包括用户流程、交互模式和视觉风格指南。专注于可用性、可访问性和用户参与度。",
    slug: "social-media-design",
    coverImage: "https://images.unsplash.com/photo-1568217775766-738427634be8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1335&q=80",
    technologies: ["Figma", "Adobe XD", "Prototyping", "User Research"],
    category: "design"
  }
]; 