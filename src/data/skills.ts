// Skills data configuration for the About page

export interface Skill {
  name: string;
  level: number;
  icon?: string;
  category: 'core' | 'advanced' | 'intermediate';
  description?: string;
  yearsOfExperience?: number;
}

export interface SkillCategory {
  name: string;
  nameZh: string;
  icon: string;
  color: string;
  skills: Skill[];
}

export const skillsData: SkillCategory[] = [
  {
    name: "Frontend Development",
    nameZh: "前端开发",
    icon: "💻",
    color: "primary",
    skills: [
      {
        name: "Vue.js (Vue3)",
        level: 88,
        icon: "💚",
        category: "core",
        description: "Composition API, enterprise admin consoles and large-scale business frontends",
        yearsOfExperience: 6
      },
      {
        name: "React.js",
        level: 85,
        icon: "⚛️",
        category: "core",
        description: "Component architecture, hooks and SPA performance optimization",
        yearsOfExperience: 4
      },
      {
        name: "Next.js",
        level: 84,
        icon: "▲",
        category: "core",
        description: "App Router, SSR/ISR and API routes — this very site runs on it",
        yearsOfExperience: 3
      },
      {
        name: "TypeScript",
        level: 85,
        icon: "📘",
        category: "core",
        description: "Type-safe development across frontend and backend",
        yearsOfExperience: 5
      },
      {
        name: "Tailwind CSS",
        level: 90,
        icon: "🌊",
        category: "core",
        description: "Utility-first CSS with custom design token systems",
        yearsOfExperience: 4
      },
      {
        name: "WeChat Mini Program",
        level: 85,
        icon: "📱",
        category: "advanced",
        description: "Native mini-program development with cloud base, subpackages and Canvas 2D imaging",
        yearsOfExperience: 3
      }
    ]
  },
  {
    name: "Backend Development",
    nameZh: "后端开发",
    icon: "⚙️",
    color: "secondary",
    skills: [
      {
        name: "Java",
        level: 90,
        icon: "☕",
        category: "core",
        description: "Enterprise-grade services, business modeling and system architecture",
        yearsOfExperience: 10
      },
      {
        name: "Spring Cloud",
        level: 86,
        icon: "🍃",
        category: "core",
        description: "Microservices, service governance and distributed business systems",
        yearsOfExperience: 6
      },
      {
        name: "Python",
        level: 85,
        icon: "🐍",
        category: "advanced",
        description: "Automation scripts, data pipelines and AI service integration",
        yearsOfExperience: 6
      },
      {
        name: "MySQL",
        level: 90,
        icon: "🐬",
        category: "core",
        description: "Schema design, query optimization and migration",
        yearsOfExperience: 10
      },
      {
        name: "Redis",
        level: 84,
        icon: "⚡",
        category: "advanced",
        description: "Caching strategies and hot-data management",
        yearsOfExperience: 5
      },
      {
        name: "Node.js",
        level: 82,
        icon: "🟢",
        category: "advanced",
        description: "REST APIs, tooling and server-side rendering",
        yearsOfExperience: 5
      }
    ]
  },
  {
    name: "AI Engineering & Automation",
    nameZh: "AI 应用与自动化",
    icon: "🤖",
    color: "accent",
    skills: [
      {
        name: "LLM Integration",
        level: 88,
        icon: "🧠",
        category: "core",
        description: "LLM integration with structured output, rule validation and human-in-the-loop review",
        yearsOfExperience: 3
      },
      {
        name: "RAG & Knowledge Bases",
        level: 85,
        icon: "📚",
        category: "core",
        description: "Enterprise knowledge bases with retrieval-augmented generation",
        yearsOfExperience: 3
      },
      {
        name: "OCR & Document Extraction",
        level: 82,
        icon: "📄",
        category: "advanced",
        description: "PDF field extraction, OCR and vision-input pipeline design",
        yearsOfExperience: 3
      },
      {
        name: "MCP Integration",
        level: 80,
        icon: "🔌",
        category: "advanced",
        description: "MCP tool integration and AI-assisted development workflows",
        yearsOfExperience: 1
      },
      {
        name: "n8n",
        level: 88,
        icon: "🔗",
        category: "core",
        description: "Data ingestion, model calls and result distribution workflows",
        yearsOfExperience: 2
      },
      {
        name: "Dify",
        level: 84,
        icon: "🎯",
        category: "advanced",
        description: "LLM app orchestration and agent workflow building",
        yearsOfExperience: 2
      }
    ]
  },
  {
    name: "Cloud & DevOps",
    nameZh: "云原生与部署",
    icon: "☁️",
    color: "secondary",
    skills: [
      {
        name: "Linux",
        level: 88,
        icon: "🐧",
        category: "core",
        description: "Server operations, ARM environments and deployment preparation",
        yearsOfExperience: 10
      },
      {
        name: "Git & GitHub",
        level: 90,
        icon: "📦",
        category: "core",
        description: "Version control, branching strategies and CI/CD workflows",
        yearsOfExperience: 10
      },
      {
        name: "Vercel",
        level: 85,
        icon: "▲",
        category: "core",
        description: "Deployment, edge caching and image optimization governance",
        yearsOfExperience: 3
      },
      {
        name: "Docker",
        level: 75,
        icon: "🐳",
        category: "advanced",
        description: "Containerization and deployment environment preparation",
        yearsOfExperience: 3
      },
      {
        name: "Kubernetes",
        level: 72,
        icon: "⚓",
        category: "intermediate",
        description: "Container orchestration and cloud-native deployment coordination",
        yearsOfExperience: 2
      },
      {
        name: "SkyWalking",
        level: 76,
        icon: "🔭",
        category: "intermediate",
        description: "Distributed tracing and observability",
        yearsOfExperience: 2
      }
    ]
  },
  {
    name: "Soft Skills",
    nameZh: "软技能",
    icon: "🧠",
    color: "neutral",
    skills: [
      {
        name: "Problem Solving",
        level: 95,
        icon: "🔍",
        category: "core",
        description: "Analytical thinking and systematic approach to challenges"
      },
      {
        name: "Communication",
        level: 90,
        icon: "💬",
        category: "core",
        description: "Clear articulation of technical concepts to diverse audiences"
      },
      {
        name: "Team Collaboration",
        level: 85,
        icon: "🤝",
        category: "advanced",
        description: "Working effectively in cross-functional teams"
      },
      {
        name: "Project Management",
        level: 80,
        icon: "📊",
        category: "advanced",
        description: "Agile methodologies, sprint planning, and delivery"
      },
      {
        name: "Mentoring",
        level: 75,
        icon: "📚",
        category: "intermediate",
        description: "Guiding junior developers and knowledge sharing"
      },
      {
        name: "Adaptability",
        level: 90,
        icon: "🔄",
        category: "core",
        description: "Quick learning and adapting to new technologies"
      }
    ]
  }
];

// Skill proficiency levels for display
export const proficiencyLevels = {
  core: {
    en: "Expert",
    zh: "专家",
    color: "bg-primary dark:bg-dark-primary"
  },
  advanced: {
    en: "Advanced",
    zh: "精通",
    color: "bg-secondary dark:bg-dark-secondary"
  },
  intermediate: {
    en: "Proficient",
    zh: "熟练",
    color: "bg-accent dark:bg-dark-accent"
  }
};
