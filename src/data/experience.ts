// Work experience data for the About page

export interface Achievement {
  text: string;
  textZh: string;
  metric?: string;
}

export interface Experience {
  id: string;
  year: string;
  yearZh: string;
  title: string;
  titleZh: string;
  company: string;
  companyZh: string;
  description: string;
  descriptionZh: string;
  achievements: Achievement[];
  techStack: string[];
  isCurrent?: boolean;
  logo?: string;
  companyUrl?: string;
  companyInfo?: CompanyInfo;
}

export interface CompanyInfo {
  industry: string;
  industryZh: string;
  size: string;
  sizeZh: string;
  location?: string;
  locationZh?: string;
  description?: string;
  descriptionZh?: string;
}

export const experienceData: Experience[] = [
  {
    id: "exp-1",
    year: "2022 - Present",
    yearZh: "2022 - 至今",
    title: "Senior Frontend Developer",
    titleZh: "高级前端开发工程师",
    company: "TechVision Inc.",
    companyZh: "科技视觉有限公司",
    description: "Lead the development of the company's flagship SaaS product, managing a team of 4 developers.",
    descriptionZh: "领导公司旗舰SaaS产品的开发，管理4人开发团队。",
    achievements: [
      {
        text: "Increased user engagement by 35% through performance optimization",
        textZh: "通过性能优化使用户参与度提升35%",
        metric: "+35%"
      },
      {
        text: "Reduced page load time by 50% implementing Next.js SSR",
        textZh: "实施Next.js SSR将页面加载时间减少50%",
        metric: "-50%"
      },
      {
        text: "Led team to complete major product rewrite in 6 months",
        textZh: "带领团队在6个月内完成主要产品重构",
        metric: "6 months"
      },
      {
        text: "Mentored 3 junior developers to mid-level positions",
        textZh: "指导3名初级开发者晋升为中级工程师",
        metric: "3 devs"
      }
    ],
    techStack: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL"],
    isCurrent: true,
    logo: "/images/companies/techvision.svg",
    companyInfo: {
      industry: "B2B SaaS",
      industryZh: "B2B SaaS",
      size: "50-200 employees",
      sizeZh: "50-200人",
      location: "San Francisco, CA",
      locationZh: "加利福尼亚州旧金山",
      description: "Leading provider of AI-powered data visualization tools",
      descriptionZh: "AI驱动的数据可视化工具领先提供商"
    }
  },
  {
    id: "exp-2",
    year: "2019 - 2022",
    yearZh: "2019 - 2022",
    title: "Full Stack Developer",
    titleZh: "全栈开发工程师",
    company: "InnovateSoft",
    companyZh: "创新软件科技",
    description: "Worked on multiple client projects using React, Node.js, and MongoDB. Designed and implemented RESTful APIs.",
    descriptionZh: "使用React、Node.js和MongoDB开发多个客户项目。设计并实现RESTful API。",
    achievements: [
      {
        text: "Delivered 15+ client projects on time and within budget",
        textZh: "按时按预算交付15+个客户项目",
        metric: "15+ projects"
      },
      {
        text: "Built RESTful APIs serving 100K+ daily requests",
        textZh: "构建服务10万+每日请求的RESTful API",
        metric: "100K+ req/day"
      },
      {
        text: "Improved code coverage from 40% to 85%",
        textZh: "将代码覆盖率从40%提升到85%",
        metric: "+45%"
      },
      {
        text: "Implemented CI/CD pipeline reducing deployment time by 60%",
        textZh: "实施CI/CD管道将部署时间减少60%",
        metric: "-60%"
      }
    ],
    techStack: ["React", "Node.js", "Express", "MongoDB", "Docker", "AWS", "Jest"],
    logo: "/images/companies/innovatesoft.svg",
    companyInfo: {
      industry: "Software Consulting",
      industryZh: "软件咨询",
      size: "20-50 employees",
      sizeZh: "20-50人",
      location: "New York, NY",
      locationZh: "纽约州纽约市",
      description: "Custom software solutions for startups and SMBs",
      descriptionZh: "为初创企业和中小企业提供定制软件解决方案"
    }
  },
  {
    id: "exp-3",
    year: "2017 - 2019",
    yearZh: "2017 - 2019",
    title: "Web Developer",
    titleZh: "Web开发工程师",
    company: "CreativeWeb Solutions",
    companyZh: "创意网络解决方案",
    description: "Developed responsive websites for clients across various industries. Collaborated with designers to implement pixel-perfect UIs.",
    descriptionZh: "为各行各业的客户开发响应式网站。与设计师合作实现像素级完美的用户界面。",
    achievements: [
      {
        text: "Developed 30+ responsive websites with 98% client satisfaction",
        textZh: "开发30+个响应式网站，客户满意度98%",
        metric: "30+ sites"
      },
      {
        text: "Achieved 95+ Google Lighthouse scores across all projects",
        textZh: "在所有项目中实现95+的Google Lighthouse分数",
        metric: "95+ score"
      },
      {
        text: "Reduced website maintenance time by 40% through modular code",
        textZh: "通过模块化代码将网站维护时间减少40%",
        metric: "-40%"
      }
    ],
    techStack: ["HTML", "CSS", "JavaScript", "React", "Git", "Figma"],
    logo: "/images/companies/creativeweb.svg",
    companyInfo: {
      industry: "Web Development Agency",
      industryZh: "网站开发代理",
      size: "10-30 employees",
      sizeZh: "10-30人",
      location: "Austin, TX",
      locationZh: "德克萨斯州奥斯汀",
      description: "Full-service web design and development agency",
      descriptionZh: "全方位网站设计和开发代理机构"
    }
  },
  {
    id: "exp-4",
    year: "2016 - 2017",
    yearZh: "2016 - 2017",
    title: "Junior Developer",
    titleZh: "初级开发工程师",
    company: "StartupHub",
    companyZh: "创业中心",
    description: "Assisted in the development of web applications. Gained experience in agile methodologies and collaborative development workflows.",
    descriptionZh: "协助开发Web应用程序。在敏捷方法论和协作开发工作流程方面获得经验。",
    achievements: [
      {
        text: "Contributed to 5+ successful product launches",
        textZh: "参与5+个成功的产品发布",
        metric: "5+ launches"
      },
      {
        text: "Learned and applied agile development practices",
        textZh: "学习并应用敏捷开发实践",
        metric: "Agile"
      },
      {
        text: "Participated in daily standups and sprint planning",
        textZh: "参与每日站会和冲刺规划",
        metric: "Scrum"
      }
    ],
    techStack: ["JavaScript", "HTML", "CSS", "Git", "jQuery", "Bootstrap"],
    logo: "/images/companies/startuphub.svg",
    companyInfo: {
      industry: "Tech Incubator",
      industryZh: "科技孵化器",
      size: "5-10 employees",
      sizeZh: "5-10人",
      location: "Boston, MA",
      locationZh: "马萨诸塞州波士顿",
      description: "Early-stage startup incubator and co-working space",
      descriptionZh: "早期创业孵化器和联合办公空间"
    }
  }
];

// Get current/existing experience
export const getCurrentExperience = () => experienceData.find(exp => exp.isCurrent);

// Get experience by ID
export const getExperienceById = (id: string) => experienceData.find(exp => exp.id === id);
