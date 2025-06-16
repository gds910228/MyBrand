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
            你好！我是一名充满激情的全栈开发者，热爱创建干净、用户友好且有影响力的数字体验。我在科技领域的旅程始于五年前，那时我出于好奇心构建了我的第一个网站。那个小项目点燃了一种随着时间推移只会变得更强烈的热情。
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            获得计算机科学学位后，我曾与初创公司和成熟公司合作，帮助他们构建用户喜爱的产品。在此过程中，我对技术、设计和人类心理学的交叉领域产生了深刻的认识。
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            我的开发方法由几个核心原则指导：
          </p>
          <ul className="text-neutral-dark dark:text-dark-neutral-dark">
            <li><strong>以用户为中心的设计：</strong> 我相信技术应该服务于人，而不是相反。我写的每一行代码都考虑到了最终用户。</li>
            <li><strong>持续学习：</strong> 科技领域迅速发展，我致力于与之共同成长。我每周都会花时间学习新技能并完善现有技能。</li>
            <li><strong>质量优于数量：</strong> 我更喜欢做少量但出色的事情，而不是做很多但平庸的事情。这一理念适用于我的代码和项目。</li>
            <li><strong>协作精神：</strong> 最好的产品是由多元化的团队共同构建的。我重视开放沟通、建设性反馈和共同成功。</li>
          </ul>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            当我不在编码时，你会发现我在大自然中徒步旅行，尝试新的烹饪食谱，或沉浸在一本好书中。这些活动帮助我保持视角并为我的技术工作带来新的想法。
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
          subtitle="让您一瞥我在编程之外的生活。"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GalleryItem 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80"
            alt="与团队成员协作的工作空间"
            caption="与我的优秀团队合作"
          />
          
          <GalleryItem 
            src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1173&q=80"
            alt="在山中徒步的人"
            caption="周末徒步冒险"
          />
          
          <GalleryItem 
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
            alt="在舒适的环境中读书的人"
            caption="与一本好书放松身心"
          />
          
          <GalleryItem 
            src="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
            alt="屏幕上有代码的笔记本电脑和咖啡"
            caption="深夜编码会话"
          />
          
          <GalleryItem 
            src="https://images.unsplash.com/photo-1511988617509-a57c8a288659?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80"
            alt="在技术会议上发言的人"
            caption="在技术会议上演讲"
          />
          
          <GalleryItem 
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
            alt="写有项目规划笔记的白板"
            caption="规划下一个大项目"
          />
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