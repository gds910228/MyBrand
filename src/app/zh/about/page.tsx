"use client";

import React from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import Container from '@/components/Container';
import Image from 'next/image';

export default function AboutPageZh() {
  return (
    <>
      {/* Hero Section */}
      <Section id="about-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-6">
              关于我
            </h1>
            <p className="text-lg text-neutral-dark dark:text-dark-neutral-dark">
              了解更多关于我的旅程、技能，以及作为开发者和创作者的驱动力。
            </p>
          </div>
          <div className="relative h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=755&q=80"
              alt="在创意工作空间使用笔记本电脑的人"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </Section>
      
      {/* Story & Philosophy Section */}
      <Section id="about-story">
        <SectionHeading
          title="我的故事与理念"
          subtitle="一瞥我的旅程和指导我工作的原则。"
        />
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            你好！我是一名专注于构建"听懂人话"的 AI 产品的开发者。在科技快速发展的时代，我发现很多AI工具虽然功能强大，但学习门槛高、使用复杂，普通人难以真正受益。因此，我致力于打造真正懂用户、易用且实用的AI解决方案。
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            我的核心理念很简单：<strong>拒谈概念，只讲落地</strong>。在充斥着各种AI概念和术语的市场中，我坚持用最朴实的语言，通过深度实测和硬核评测，帮助用户找到真正能解决问题的工具。每一篇评测、每一个产品推荐，都基于真实使用体验和具体场景测试。
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            在 MisoTech，我分享的内容遵循三个原则：
          </p>
          <ul className="text-neutral-dark dark:text-dark-neutral-dark">
            <li><strong>硬核评测：</strong> 不做表面功夫，深入产品核心功能，测试真实场景下的表现。无论是AI编程工具、图像生成，还是知识库管理，我都亲自上手、全面测试。</li>
            <li><strong>拒绝空谈：</strong> 不讲大道理，不堆砌概念。直接告诉你这个工具能做什么、不能做什么、适合谁用、怎么用效果最好。</li>
            <li><strong>用户视角：</strong> 站在普通用户角度思考问题。技术再强大，如果不好用、学不会，就没有价值。我关注的是真实的使用体验和实际生产力提升。</li>
          </ul>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            当我不在写代码或测试新工具时，你会发现我在研究AI领域的最新进展，与社区交流实践经验，或在寻找下一个能够真正改变日常工作的AI工具。我相信，最好的技术应该是透明的——它默默地在背后工作，让你的生活更简单、更高效。
          </p>
        </div>
      </Section>
      
      {/* Skills Section */}
      <Section id="about-skills" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading 
          title="技能与专长" 
          subtitle="我的技术能力和熟练程度的全面概述。"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {/* Frontend Skills */}
          <div>
            <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">前端开发</h3>
            <div className="space-y-4">
              <SkillBar skill="React.js" level={90} />
              <SkillBar skill="Next.js" level={85} />
              <SkillBar skill="TypeScript" level={80} />
              <SkillBar skill="HTML/CSS" level={95} />
              <SkillBar skill="Tailwind CSS" level={90} />
              <SkillBar skill="Redux" level={75} />
            </div>
          </div>
          
          {/* Backend Skills */}
          <div>
            <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">后端开发</h3>
            <div className="space-y-4">
              <SkillBar skill="Node.js" level={85} />
              <SkillBar skill="Express" level={80} />
              <SkillBar skill="MongoDB" level={75} />
              <SkillBar skill="PostgreSQL" level={70} />
              <SkillBar skill="GraphQL" level={65} />
              <SkillBar skill="REST API 设计" level={85} />
            </div>
          </div>
          
          {/* Tools & Others */}
          <div>
            <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">工具与平台</h3>
            <div className="space-y-4">
              <SkillBar skill="Git & GitHub" level={90} />
              <SkillBar skill="Docker" level={70} />
              <SkillBar skill="AWS" level={65} />
              <SkillBar skill="Vercel" level={85} />
              <SkillBar skill="Figma" level={75} />
              <SkillBar skill="Jest" level={80} />
            </div>
          </div>
          
          {/* Soft Skills */}
          <div>
            <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">软技能</h3>
            <div className="space-y-4">
              <SkillBar skill="问题解决" level={95} />
              <SkillBar skill="沟通能力" level={90} />
              <SkillBar skill="团队协作" level={85} />
              <SkillBar skill="项目管理" level={80} />
              <SkillBar skill="指导与培训" level={75} />
              <SkillBar skill="适应能力" level={90} />
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center text-neutral-medium dark:text-dark-neutral-medium">
          <p>* 技能等级基于相对熟练程度和经验</p>
        </div>
      </Section>
      
      {/* Experience Timeline Section */}
      <Section id="about-experience">
        <SectionHeading 
          title="工作经历" 
          subtitle="我在科技行业的专业旅程。"
        />
        
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-0 md:left-1/2 h-full w-0.5 bg-neutral-light dark:bg-dark-neutral-light transform -translate-x-1/2"></div>
          
          <div className="space-y-12">
            <TimelineItem 
              year="2022 - 至今"
              title="高级前端开发工程师"
              company="科技视觉有限公司"
              description="领导公司旗舰SaaS产品的开发，管理4人开发团队。实施的新功能使用户参与度提高了35%。"
              isLeft={true}
            />
            
            <TimelineItem 
              year="2019 - 2022"
              title="全栈开发工程师"
              company="创新软件科技"
              description="使用React、Node.js和MongoDB开发多个客户项目。设计并实现RESTful API并整合第三方服务。"
              isLeft={false}
            />
            
            <TimelineItem 
              year="2017 - 2019"
              title="Web开发工程师"
              company="创意网络解决方案"
              description="为各行各业的客户开发响应式网站。与设计师合作实现像素级完美的用户界面。"
              isLeft={true}
            />
            
            <TimelineItem 
              year="2016 - 2017"
              title="初级开发工程师"
              company="创业中心"
              description="协助开发Web应用程序。在敏捷方法论和协作开发工作流程方面获得经验。"
              isLeft={false}
            />
          </div>
        </div>
      </Section>
      
      {/* Personal Gallery Section */}
      <Section id="about-gallery" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading
          title="代码之外的生活"
          subtitle="科技探索与生活灵感的日常瞬间。"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GalleryItem
            src="https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=1171&q=80"
            alt="探索AI技术与未来趋势"
            caption="探索前沿AI技术"
          />

          <GalleryItem
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1173&q=80"
            alt="深度测试新的AI工具"
            caption="深度实测AI工具"
          />

          <GalleryItem
            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
            alt="与科技社区交流分享"
            caption="与社区交流实践经验"
          />

          <GalleryItem
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
            alt="阅读最新AI研究论文"
            caption="追踪AI领域最新进展"
          />

          <GalleryItem
            src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1171&q=80"
            alt="在咖啡店思考产品创意"
            caption="寻找提升效率的灵感"
          />

          <GalleryItem
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
            alt="参与技术讨论和头脑风暴"
            caption="参与技术讨论与头脑风暴"
          />
        </div>

        {/* 额外说明文字 */}
        <div className="mt-12 text-center max-w-3xl mx-auto">
          <p className="text-neutral-dark dark:text-dark-neutral-dark text-lg">
            除了代码和评测，我热衷于探索AI技术的边界，与社区分享实践经验，
            并思考如何让复杂的AI工具变得简单易用。我相信，真正的技术创新应该让每个人的生活更美好。
          </p>
        </div>
      </Section>
    </>
  );
}

// Skill Bar Component
interface SkillBarProps {
  skill: string;
  level: number;
}

const SkillBar: React.FC<SkillBarProps> = ({ skill, level }) => {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-medium text-neutral-darker dark:text-dark-neutral-darker">{skill}</span>
        <span className="text-sm text-neutral-medium dark:text-dark-neutral-medium">{level}%</span>
      </div>
      <div className="h-2 bg-neutral-light dark:bg-dark-neutral-light rounded-full">
        <div 
          className="h-full bg-primary dark:bg-dark-primary rounded-full" 
          style={{ width: `${level}%` }}
        ></div>
      </div>
    </div>
  );
};

// Timeline Item Component
interface TimelineItemProps {
  year: string;
  title: string;
  company: string;
  description: string;
  isLeft: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ year, title, company, description, isLeft }) => {
  return (
    <div className={`flex flex-col md:flex-row ${isLeft ? 'md:flex-row-reverse' : ''}`}>
      <div className="md:w-1/2" />
      <div className="relative flex items-center justify-center">
        <div className="h-6 w-6 rounded-full bg-primary dark:bg-dark-primary z-10 relative"></div>
      </div>
      <div className="md:w-1/2 pt-4 md:pt-0 pl-6 md:pl-0 md:px-6">
        <div className="bg-white dark:bg-dark-bg-secondary p-4 md:p-6 rounded-lg shadow-md">
          <span className="text-sm font-medium text-primary dark:text-dark-primary">{year}</span>
          <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mt-1">{title}</h3>
          <p className="text-neutral-medium dark:text-dark-neutral-medium">{company}</p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark mt-2">{description}</p>
        </div>
      </div>
    </div>
  );
};

// Gallery Item Component
interface GalleryItemProps {
  src: string;
  alt: string;
  caption?: string;
}

const GalleryItem: React.FC<GalleryItemProps> = ({ src, alt, caption }) => {
  return (
    <div className="relative group overflow-hidden rounded-lg shadow-md">
      <div className="aspect-w-3 aspect-h-2 bg-neutral-muted">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      {caption && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white text-sm md:text-base">{caption}</p>
        </div>
      )}
    </div>
  );
}; 