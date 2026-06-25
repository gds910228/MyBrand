// Service tier definitions, hero/why/process/FAQ copy for /services and /zh/services.
// Single source of truth — page files import SERVICES[locale] and stay lean.

export type ServiceAccent = 'orange' | 'blue' | 'green';

export interface ServiceTier {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  timeline: string;
  accent: ServiceAccent;
}

export interface ServicesCopy {
  hero: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    secondaryHref: string;
  };
  tiersHeading: { title: string; subtitle: string };
  tiers: ServiceTier[];
  advisory: {
    label: string;
    title: string;
    subtitle: string;
    description: string;
    features: string[];
    cta: string;
  };
  whyHeading: { title: string; subtitle: string };
  why: { stat: string; label: string; description: string }[];
  processHeading: { title: string; subtitle: string };
  process: { number: string; title: string; description: string }[];
  inquiry: {
    heading: string;
    subheading: string;
    sections: {
      contact: string;
      project: string;
    };
    labels: {
      name: string;
      email: string;
      company: string;
      backupContact: string;
      backupContactHint: string;
      serviceType: string;
      budget: string;
      timeline: string;
      description: string;
      descriptionHint: string;
      referral: string;
      referralHint: string;
    };
    options: {
      serviceTypes: { value: string; label: string }[];
      budgets: { value: string; label: string }[];
      timelines: { value: string; label: string }[];
      referrals: { value: string; label: string }[];
    };
    placeholders: {
      name: string;
      email: string;
      company: string;
      backupContact: string;
      description: string;
    };
    submit: string;
    submitting: string;
    success: string;
    error: string;
    footnote: string;
  };
  faqHeading: { title: string; subtitle: string };
  faq: { question: string; answer: string }[];
}

export const SERVICES: Record<'en' | 'zh', ServicesCopy> = {
  en: {
    hero: {
      badge: '// AVAILABLE FOR HIRE · Q3 2026',
      titleLine1: 'Build Real-World AI Products.',
      titleLine2: 'Not Just Demos.',
      subtitle:
        "Archer — ex-Big-Tech senior engineer with 10+ years of full-stack delivery for Fortune 500 retail / automotive / QSR clients. Now a solo indie developer specializing in shipping AI to production.",
      ctaPrimary: 'Get a Quote →',
      ctaSecondary: 'See Case Studies',
      secondaryHref: '/projects',
    },
    tiersHeading: {
      title: 'What I Build',
      subtitle: 'Three productized engagements + advisory. Every tier ships end-to-end.',
    },
    tiers: [
      {
        number: '01',
        title: 'AI Application Engineering',
        subtitle: 'AI 落地工坊',
        description:
          "Turn LLMs into shippable products. Most teams build demos; I ship systems that survive real users, real data, and real cost constraints.",
        features: [
          'RAG knowledge bases with vector search + role-based access',
          'Conversational AI agents (sales, support, internal tools)',
          'n8n / Coze / Dify workflow orchestration & integration',
          'Multi-provider LLM routing & cost optimization',
        ],
        timeline: 'MVP in 2 weeks · Full build 4–8 weeks',
        accent: 'orange',
      },
      {
        number: '02',
        title: 'Enterprise System Build',
        subtitle: '企业系统打造',
        description:
          'Backed by 10 years of delivering core systems for Fortune 500 retail, automotive, and QSR clients. I ship admin panels and business systems that scale to thousands of users without rewrites.',
        features: [
          'Admin panels with multi-role permissions & audit logs',
          'CRM / ERP / WMS / internal operations tools',
          'Data dashboards & BI reporting',
          '3rd-party integrations (DingTalk · WeCom · SAP · Salesforce)',
        ],
        timeline: '6–16 weeks · Phased delivery',
        accent: 'blue',
      },
      {
        number: '03',
        title: 'Product MVP & Launch',
        subtitle: '产品快船',
        description:
          'Have an idea but need it live this month? I take you from spec to deployed product fast. The site you are on now is itself a sample of this tier.',
        features: [
          'Landing pages (Next.js · animation · SEO · Vercel)',
          'SaaS MVPs (auth · payments · core flows · admin)',
          'Notion-powered marketing or product sites',
          'Technical content writing & ghost-blogging',
        ],
        timeline: '5–21 days · Fixed-scope packages',
        accent: 'green',
      },
    ],
    advisory: {
      label: '// ADVISORY',
      title: 'Technical Advisory',
      subtitle: '技术顾问',
      description:
        "Don't need code yet — need a senior pair of eyes? Architecture reviews, tech selection, team mentoring, and monthly office hours for early-stage AI startups and growing teams.",
      features: [
        'Architecture & code reviews',
        'AI / LLM tech selection',
        'Team mentoring & 1:1 coaching',
        'Monthly retainer or hourly engagement',
      ],
      cta: 'Discuss Engagement →',
    },
    whyHeading: {
      title: 'Why Work With Me',
      subtitle: 'Senior delivery, indie speed, AI-first by default.',
    },
    why: [
      {
        stat: '10+',
        label: 'YEARS SHIPPING',
        description: 'A decade of full-stack delivery, project management, and product ownership.',
      },
      {
        stat: 'F500',
        label: 'CLIENT BACKGROUND',
        description: 'Built core business systems for Fortune 500 retail, automotive, and QSR clients.',
      },
      {
        stat: 'AI',
        label: 'FIRST ARCHITECTURE',
        description: 'LLMs, RAG, agents, and workflow tools are first-class in everything I build.',
      },
      {
        stat: '1:1',
        label: 'SOLO ACCOUNTABILITY',
        description: "You talk to the person building it. No account managers, no handoffs, no surprises.",
      },
    ],
    processHeading: {
      title: 'How We Work',
      subtitle: 'Same four steps, every engagement. Designed to keep scope honest and momentum high.',
    },
    process: [
      {
        number: '01',
        title: 'Discovery',
        description:
          '30–60 min call to align on goals, constraints, success metrics, and risks. No charge — you walk away with clarity either way.',
      },
      {
        number: '02',
        title: 'Proposal',
        description:
          'A fixed-scope proposal with deliverables, timeline, milestones, and price. Reviewed and signed before any code is written.',
      },
      {
        number: '03',
        title: 'Build',
        description:
          'Weekly demo + Notion-tracked progress. You see what is shipping every week. Scope changes are written, priced, and approved.',
      },
      {
        number: '04',
        title: 'Launch',
        description:
          'Deployed, documented, and handed off. 30 days of free post-launch support included on every fixed-scope engagement.',
      },
    ],
    inquiry: {
      heading: 'Start a Project',
      subheading:
        'Tell me about your project. I usually reply within 24 hours — the more detail you share, the more useful the first reply.',
      sections: {
        contact: '// CONTACT',
        project: '// PROJECT',
      },
      labels: {
        name: 'Name',
        email: 'Email',
        company: 'Company / Team (optional)',
        backupContact: 'WeChat / Telegram (optional)',
        backupContactHint: 'Preferred for clients in China — speeds up response.',
        serviceType: 'What do you need?',
        budget: 'Budget range',
        timeline: 'Timeline',
        description: 'Project description',
        descriptionHint: 'What is the business context, the problem to solve, and any resources already in place? Minimum 30 characters.',
        referral: 'How did you hear about me? (optional)',
        referralHint: 'Helps me focus where to invest time.',
      },
      options: {
        serviceTypes: [
          { value: 'ai-app', label: 'AI Application (knowledge base / agent / workflow)' },
          { value: 'enterprise', label: 'Enterprise System (admin / CRM / ERP / WMS)' },
          { value: 'mvp', label: 'Product MVP / Landing page / Marketing site' },
          { value: 'advisory', label: 'Technical Advisory / Architecture review' },
          { value: 'other', label: 'Other / Not sure yet' },
        ],
        budgets: [
          { value: 'under-1500', label: 'Under $1,500 USD / Under ¥10,000' },
          { value: '1500-7500', label: '$1,500 – $7,500 / ¥10,000 – ¥50,000' },
          { value: '7500-30000', label: '$7,500 – $30,000 / ¥50,000 – ¥200,000' },
          { value: 'over-30000', label: 'Over $30,000 USD / Over ¥200,000' },
          { value: 'tbd', label: 'Not sure yet' },
        ],
        timelines: [
          { value: 'urgent', label: 'Urgent — kick off within 2 weeks' },
          { value: 'this-month', label: 'Within 1 month' },
          { value: 'this-quarter', label: '1 – 3 months' },
          { value: 'flexible', label: 'Flexible' },
        ],
        referrals: [
          { value: 'referral', label: 'Friend / colleague referral' },
          { value: 'x-twitter', label: 'X / Twitter' },
          { value: 'jike', label: '即刻 (Jike)' },
          { value: 'search', label: 'Search engine' },
          { value: 'blog', label: 'This site / blog' },
          { value: 'linkedin', label: 'LinkedIn' },
          { value: 'other', label: 'Other' },
        ],
      },
      placeholders: {
        name: 'Your name',
        email: 'you@company.com',
        company: 'Acme Inc. (optional)',
        backupContact: '@yourhandle or wechat ID (optional)',
        description: 'Brief context — what you are building, who it is for, and what stage you are at...',
      },
      submit: 'Send Inquiry',
      submitting: 'Sending...',
      success: "Inquiry received. I will reply within 24 hours — usually faster.",
      error: 'Something went wrong sending the inquiry. Please email me directly at 1479333689@qq.com.',
      footnote: 'Information stays confidential. Used only to scope your project.',
    },
    faqHeading: {
      title: 'Frequently Asked',
      subtitle: '',
    },
    faq: [
      {
        question: "What's your typical engagement model?",
        answer:
          'Fixed-scope, fixed-price for most builds. Time-and-materials only for open-ended advisory or research work. 50% upfront for builds under $10k, milestone-based for larger engagements.',
      },
      {
        question: 'How do you handle NDA, IP, and source-code handoff?',
        answer:
          'Happy to sign mutual NDA before discovery. All source code, deployment access, and documentation transfer to you on final payment. No vendor lock-in — you own it.',
      },
      {
        question: 'Can you work in my timezone and language?',
        answer:
          'I work remote-first and have shipped projects for clients across China, the US, and Europe. Fluent in Chinese and professional English. Async-first, with scheduled sync calls as needed.',
      },
      {
        question: "What if my project doesn't fit your tiers?",
        answer:
          "The tiers are starting points, not boxes. Send a description through the form and I will tell you honestly whether it is a fit, what it would cost, or who else you might talk to. No-pressure conversation either way.",
      },
    ],
  },
  zh: {
    hero: {
      badge: '// 接单中 · 2026 Q3',
      titleLine1: '让 AI 真正落地，',
      titleLine2: '而不只是停留在 Demo',
      subtitle:
        'Archer——前大厂高级工程师，10+ 年全栈交付经验，曾为多家世界 500 强零售、汽车、餐饮客户主导核心业务系统建设。现为独立开发者，专注把 AI 变成可上线、可维护、可计算成本的真实产品。',
      ctaPrimary: '立即咨询 →',
      ctaSecondary: '查看案例',
      secondaryHref: '/zh/projects',
    },
    tiersHeading: {
      title: '我的服务',
      subtitle: '三档产品化交付包 + 技术顾问。每一档都端到端负责到底。',
    },
    tiers: [
      {
        number: '01',
        title: 'AI Application Engineering',
        subtitle: 'AI 落地工坊',
        description:
          '把 LLM 变成能真正交付的产品。大多数团队只能做 Demo，我交付能扛真实用户、真实数据、真实成本的系统。',
        features: [
          'RAG 知识库（向量检索 + 多角色权限）',
          '对话式 AI 智能体（销售/客服/内部工具）',
          'n8n / Coze / Dify 工作流编排与系统集成',
          '多模型路由与 LLM 成本优化',
        ],
        timeline: 'MVP 2 周 · 完整版 4–8 周',
        accent: 'orange',
      },
      {
        number: '02',
        title: 'Enterprise System Build',
        subtitle: '企业系统打造',
        description:
          '基于 10 年世界 500 强零售、汽车、餐饮客户的核心系统交付经验，打造能撑住数千用户、不需要重写的管理后台与业务系统。',
        features: [
          '多角色权限管理后台（含审计日志）',
          'CRM / ERP / WMS / 内部运营工具',
          '数据看板与 BI 报表',
          '第三方系统集成（钉钉 · 企微 · SAP · Salesforce）',
        ],
        timeline: '6–16 周 · 分阶段交付',
        accent: 'blue',
      },
      {
        number: '03',
        title: 'Product MVP & Launch',
        subtitle: '产品快船',
        description:
          '有想法，需要这个月就上线？从需求到部署上线，最短 5 天交付。你现在看到的这个站点，就是这一档的实样。',
        features: [
          'Landing Page（Next.js · 动效 · SEO · Vercel 部署）',
          'SaaS MVP（认证 · 支付 · 核心流程 · 管理后台）',
          'Notion 驱动的营销/产品站',
          '技术博客代写与内容产出',
        ],
        timeline: '5–21 天 · 固定范围打包',
        accent: 'green',
      },
    ],
    advisory: {
      label: '// 顾问服务',
      title: 'Technical Advisory',
      subtitle: '技术顾问',
      description:
        '还不需要写代码，只想要一双资深的眼睛？提供架构评审、技术选型、团队 mentoring、月度 office hour，适合早期 AI 创业团队和成长期工程团队。',
      features: [
        '架构与代码评审',
        'AI / LLM 技术选型',
        '团队 mentoring 与 1:1 coaching',
        '月度顾问费或按小时',
      ],
      cta: '聊聊合作方式 →',
    },
    whyHeading: {
      title: '为什么选择我',
      subtitle: '资深交付 · 独立速度 · AI 优先架构',
    },
    why: [
      {
        stat: '10+',
        label: '年交付经验',
        description: '十年全栈交付、项目管理与产品负责经验。',
      },
      {
        stat: 'F500',
        label: '世界 500 强背景',
        description: '曾为多家世界 500 强零售、汽车、餐饮客户主导核心系统建设。',
      },
      {
        stat: 'AI',
        label: '优先架构',
        description: 'LLM、RAG、智能体、工作流是默认能力，不是事后追加。',
      },
      {
        stat: '1:1',
        label: '独立负责',
        description: '对接的是真正在写代码的人。没有客户经理，没有交接，没有意外。',
      },
    ],
    processHeading: {
      title: '合作流程',
      subtitle: '每一次合作都走同一个四步流程。设计目标：控住范围、保持节奏。',
    },
    process: [
      {
        number: '01',
        title: '需求沟通',
        description:
          '30–60 分钟通话，对齐目标、约束、成功标准、风险。免费，无论是否合作你都能带走一份清晰判断。',
      },
      {
        number: '02',
        title: '方案报价',
        description:
          '出固定范围方案，包含交付物、时间线、里程碑、价格。签字确认后才动手写代码。',
      },
      {
        number: '03',
        title: '迭代交付',
        description:
          '每周 demo + Notion 进度同步。你每周都能看到产出。范围变更书面记录、报价、确认。',
      },
      {
        number: '04',
        title: '上线交付',
        description:
          '部署上线 · 文档齐备 · 全量交付。固定范围项目附赠 30 天免费上线后支持。',
      },
    ],
    inquiry: {
      heading: '发起项目咨询',
      subheading: '告诉我你的项目情况。通常 24 小时内回复——你提供的细节越多，第一封回复对你越有用。',
      sections: {
        contact: '// 联系方式',
        project: '// 项目信息',
      },
      labels: {
        name: '姓名',
        email: '邮箱',
        company: '公司 / 团队（选填）',
        backupContact: '微信 / Telegram（选填）',
        backupContactHint: '国内客户推荐填写，可加快响应。',
        serviceType: '你需要什么？',
        budget: '预算范围',
        timeline: '时间线',
        description: '项目描述',
        descriptionHint: '业务背景、想解决的问题、已有的资源——越具体越好。至少 30 字。',
        referral: '从哪里了解到我？（选填）',
        referralHint: '帮助我把时间投在对的渠道。',
      },
      options: {
        serviceTypes: [
          { value: 'ai-app', label: 'AI 应用（知识库 / 智能体 / 工作流）' },
          { value: 'enterprise', label: '企业系统（管理后台 / CRM / ERP / WMS）' },
          { value: 'mvp', label: '产品 MVP / 落地页 / 官网' },
          { value: 'advisory', label: '技术顾问 / 架构评审' },
          { value: 'other', label: '其他 / 还不确定' },
        ],
        budgets: [
          { value: 'under-1500', label: '¥10,000 以下 / 不到 $1,500' },
          { value: '1500-7500', label: '¥10,000 – 50,000 / $1,500 – $7,500' },
          { value: '7500-30000', label: '¥50,000 – 200,000 / $7,500 – $30,000' },
          { value: 'over-30000', label: '¥200,000 以上 / $30,000 以上' },
          { value: 'tbd', label: '还不确定' },
        ],
        timelines: [
          { value: 'urgent', label: '紧急——2 周内启动' },
          { value: 'this-month', label: '1 个月内' },
          { value: 'this-quarter', label: '1 – 3 个月' },
          { value: 'flexible', label: '时间灵活' },
        ],
        referrals: [
          { value: 'referral', label: '朋友 / 同事推荐' },
          { value: 'x-twitter', label: 'X / Twitter' },
          { value: 'jike', label: '即刻' },
          { value: 'search', label: '搜索引擎' },
          { value: 'blog', label: '本站 / 博客' },
          { value: 'linkedin', label: 'LinkedIn' },
          { value: 'other', label: '其他' },
        ],
      },
      placeholders: {
        name: '你的姓名',
        email: 'you@company.com',
        company: '公司名（选填）',
        backupContact: '微信号或 @TelegramID（选填）',
        description: '简要说明：在做什么、给谁用、目前到哪一步…',
      },
      submit: '发送咨询',
      submitting: '发送中...',
      success: '已收到，通常 24 小时内回复（一般会更快）。',
      error: '发送出了点问题，可直接邮件联系：1479333689@qq.com',
      footnote: '信息保密，仅用于评估你的项目。',
    },
    faqHeading: {
      title: '常见问题',
      subtitle: '',
    },
    faq: [
      {
        question: '通常用什么合作模式？',
        answer:
          '大多数项目采用固定范围 + 固定价格。开放式咨询/研究类项目可走按时计费。1 万美金以下项目预付 50%，更大项目按里程碑结算。',
      },
      {
        question: '保密协议、知识产权、源码交付怎么处理？',
        answer:
          '需求沟通前可签互相保密协议（NDA）。所有源代码、部署权限、文档在尾款支付后全部移交给你。无供应商绑定——东西是你的。',
      },
      {
        question: '能配合我的时区和语言吗？',
        answer:
          '远程优先工作，曾为中国、美国、欧洲多地客户交付项目。中文母语，英文专业沟通。异步为主，根据需要安排同步通话。',
      },
      {
        question: '如果我的项目不在你列出的服务包里呢？',
        answer:
          '这些服务包是起点，不是边框。通过表单描述一下，我会诚实地告诉你能不能接、大约多少钱，或者推荐更合适的人。无论结果如何都不会施压。',
      },
    ],
  },
};
