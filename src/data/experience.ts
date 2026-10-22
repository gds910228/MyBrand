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
    id: "exp-0",
    year: "2025 - Present",
    yearZh: "2025 - 至今",
    title: "Founder · AI Engineering Lead / FDE",
    titleZh: "创始人 · AI 应用技术负责人 / FDE",
    company: "OPC (One-Person Company)",
    companyZh: "OPC（一人公司）",
    description: "Running a one-person company delivering AI application development, technical consulting and custom systems — from requirement analysis and solution design to full-stack development and deployment coordination.",
    descriptionZh: "运营一人公司，为企业提供 AI 应用开发、技术咨询与定制化系统服务，覆盖智能导购客服、招投评审辅助、企业知识库与流程自动化；从需求分析、技术方案到全栈开发与部署协调全程负责。",
    achievements: [
      {
        text: "Unified operations platform for a large pharmaceutical group (~30 subsidiaries, 60 SD-WAN links): project management, full-stack development and delivery coordination",
        textZh: "某大型医药集团统一运营管理平台：覆盖约 30 家子公司、60 条 SD-WAN 线路，负责项目管理、全栈开发与技术交付协调",
        metric: "30+ 子公司"
      },
      {
        text: "AI document pipeline: local Ollama/LLM API testing, PDF parsing comparison (text extraction / OCR / vision input), structured field output with human review",
        textZh: "AI 文档处理链路：本地 Ollama/LLM 接口测试与 PDF 解析三路方案对比（文本提取/OCR/视觉输入），设计结构化字段输出与人工复核流程",
        metric: "LLM 落地"
      },
      {
        text: "Xinchuang stack coordination: HCS, Kylin OS, DM8, BES/BWS version compatibility, backup & recovery drills and cloud resource scoping",
        textZh: "国产化栈协调：华为 HCS、麒麟、达梦 DM8、BES/BWS 版本兼容确认，梳理备份恢复演练与云资源询配",
        metric: "国产化适配"
      },
      {
        text: "Huawei iMaster NCE-Campus single-node deployment and SD-WAN interface integration",
        textZh: "华为 iMaster NCE-Campus 单节点部署与 SD-WAN 接口对接",
        metric: "NCE 部署"
      },
      {
        text: "Runner-up of the Lanyun MCP Competition",
        textZh: "蓝耘 MCP 大赛亚军",
        metric: "全国亚军"
      }
    ],
    techStack: ["Vue3", "Java", "Spring Cloud", "n8n", "Dify", "Ollama"],
    isCurrent: true,
    companyInfo: {
      industry: "AI Application & Tech Services",
      industryZh: "AI 应用与技术服务",
      size: "Solo founder",
      sizeZh: "一人公司",
      location: "Remote",
      locationZh: "远程",
      description: "AI application development, workflow automation and technical consulting",
      descriptionZh: "AI 应用开发、流程自动化与技术咨询"
    }
  },
  {
    id: "exp-1",
    year: "2022 - 2025",
    yearZh: "2022 - 2025",
    title: "Full-Stack Developer (AI)",
    titleZh: "全栈开发工程师（AI 方向）",
    company: "Techsun (Shanghai Tianzheng Juhe Network Tech)",
    companyZh: "上海天徵聚合网络科技有限公司（Techsun）",
    description: "Developed Techsun CRM 1.0/2.0 and the standard-product admin console; led AI feature development (AI·Guide / SocialHub·AI) and delivered enterprise client projects.",
    descriptionZh: "参与 Techsun CRM 1.0/2.0 及标品后台的设计、开发与性能优化；主导 AI·Guide / SocialHub·AI 等 AI 功能研发；参与 Adidas CRM、通用中国 GMC 商城等企业客户项目交付。",
    achievements: [
      {
        text: "Led Techsun AI·Guide / SocialHub·AI development, integrating smart recommendations, customer segmentation and auto-reply into existing business systems",
        textZh: "主导 Techsun AI·Guide / SocialHub·AI 研发，将智能推荐、客户分群与自动应答能力接入既有业务系统",
        metric: "AI 能力落地"
      },
      {
        text: "Built key modules of Techsun CRM 1.0/2.0 and the standard-product admin console, with interface implementation and performance optimization",
        textZh: "承担 CRM 1.0/2.0 及标品后台关键模块开发、接口实现与性能优化，支撑企业客户管理与业务流程",
        metric: "CRM 1.0→2.0"
      },
      {
        text: "Adidas CRM / GM China GMC Mall: key module design, core implementation, integration testing and delivery support",
        textZh: "Adidas CRM / 通用中国 GMC 商城关键模块设计与核心代码，配合完成接口联调、缺陷处理与交付支持",
        metric: "企业客户交付"
      },
      {
        text: "Drove technical evolution with service-oriented architecture and data-processing components",
        textZh: "结合服务化与数据处理组件推进业务系统技术演进，负责问题排查与迭代任务协调",
        metric: "技术演进"
      }
    ],
    techStack: ["Java", "Spring Cloud", "Vue3", "MySQL", "Redis", "Kafka"]
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
