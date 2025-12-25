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
        name: "React.js",
        level: 90,
        icon: "⚛️",
        category: "core",
        description: "Building complex SPAs with hooks, context, and performance optimization",
        yearsOfExperience: 5
      },
      {
        name: "Next.js",
        level: 85,
        icon: "▲",
        category: "core",
        description: "SSR, SSG, API routes, and app router architecture",
        yearsOfExperience: 4
      },
      {
        name: "TypeScript",
        level: 80,
        icon: "📘",
        category: "core",
        description: "Type-safe development with advanced typing patterns",
        yearsOfExperience: 4
      },
      {
        name: "HTML/CSS",
        level: 95,
        icon: "🎨",
        category: "core",
        description: "Semantic HTML, modern CSS, animations, and responsive design",
        yearsOfExperience: 6
      },
      {
        name: "Tailwind CSS",
        level: 90,
        icon: "🌊",
        category: "core",
        description: "Utility-first CSS, custom components, and design systems",
        yearsOfExperience: 3
      },
      {
        name: "Redux",
        level: 75,
        icon: "🔄",
        category: "advanced",
        description: "State management with Redux Toolkit and middleware",
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
        name: "Node.js",
        level: 85,
        icon: "🟢",
        category: "core",
        description: "RESTful APIs, microservices, and server-side applications",
        yearsOfExperience: 4
      },
      {
        name: "Express",
        level: 80,
        icon: "🚂",
        category: "advanced",
        description: "Building robust web servers and REST APIs",
        yearsOfExperience: 4
      },
      {
        name: "MongoDB",
        level: 75,
        icon: "🍃",
        category: "advanced",
        description: "NoSQL database design, aggregation pipelines, and indexing",
        yearsOfExperience: 3
      },
      {
        name: "PostgreSQL",
        level: 70,
        icon: "🐘",
        category: "advanced",
        description: "Relational databases, complex queries, and optimization",
        yearsOfExperience: 2
      },
      {
        name: "GraphQL",
        level: 65,
        icon: "◈",
        category: "intermediate",
        description: "API design, resolvers, and Apollo Client",
        yearsOfExperience: 2
      },
      {
        name: "REST API Design",
        level: 85,
        icon: "🔗",
        category: "core",
        description: "API architecture, documentation, and best practices",
        yearsOfExperience: 4
      }
    ]
  },
  {
    name: "Tools & Platforms",
    nameZh: "工具与平台",
    icon: "🛠️",
    color: "accent",
    skills: [
      {
        name: "Git & GitHub",
        level: 90,
        icon: "📦",
        category: "core",
        description: "Version control, branching strategies, and collaboration workflows",
        yearsOfExperience: 6
      },
      {
        name: "Docker",
        level: 70,
        icon: "🐳",
        category: "advanced",
        description: "Containerization, Docker Compose, and orchestration",
        yearsOfExperience: 2
      },
      {
        name: "AWS",
        level: 65,
        icon: "☁️",
        category: "intermediate",
        description: "EC2, S3, Lambda, and cloud infrastructure",
        yearsOfExperience: 2
      },
      {
        name: "Vercel",
        level: 85,
        icon: "▲",
        category: "core",
        description: "Deployment, CI/CD, and edge functions",
        yearsOfExperience: 3
      },
      {
        name: "Figma",
        level: 75,
        icon: "🎯",
        category: "advanced",
        description: "UI design, prototyping, and design systems",
        yearsOfExperience: 3
      },
      {
        name: "Jest",
        level: 80,
        icon: "🃏",
        category: "advanced",
        description: "Unit testing, integration testing, and test-driven development",
        yearsOfExperience: 3
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
