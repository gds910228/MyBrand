"use client";

import React from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import Container from '@/components/Container';
import Image from 'next/image';
import { skillsData } from '@/data/skills';
import { experienceData } from '@/data/experience';
import SkillCategoryComponent from '@/components/SkillCategory';
import TimelineItem from '@/components/TimelineItem';

// Gallery Item Component
interface GalleryItemProps {
  src: string;
  localSrc?: string; // 本地图片路径，优先使用
  alt: string;
  caption?: string;
  category?: 'work' | 'life' | 'inspiration';
  icon?: string;
}

// Gallery data configuration
const galleryItems: GalleryItemProps[] = [
  {
    src: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=1171&q=80",
    localSrc: "/images/about/work/ai-research.jpg", // 替换为本地图片
    alt: "探索AI技术与未来趋势",
    caption: "探索前沿AI技术",
    category: "work",
    icon: "🤖"
  },
  {
    src: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1173&q=80",
    localSrc: "/images/about/work/testing-tools.jpg",
    alt: "深度测试新的AI工具",
    caption: "深度实测AI工具",
    category: "work",
    icon: "🔍"
  },
  {
    src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
    localSrc: "/images/about/work/community.jpg",
    alt: "与科技社区交流分享",
    caption: "与社区交流实践经验",
    category: "work",
    icon: "👥"
  },
  {
    src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
    localSrc: "/images/about/inspiration/learning.jpg",
    alt: "阅读最新AI研究论文",
    caption: "追踪AI领域最新进展",
    category: "inspiration",
    icon: "📚"
  },
  {
    src: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1171&q=80",
    localSrc: "/images/about/life/cafe-thinking.jpg",
    alt: "在咖啡店思考产品创意",
    caption: "寻找提升效率的灵感",
    category: "life",
    icon: "💡"
  },
  {
    src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    localSrc: "/images/about/life/reading.jpg",
    alt: "阅读技术书籍和文档",
    caption: "通过阅读持续学习",
    category: "life",
    icon: "📖"
  },
  {
    src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    localSrc: "/images/about/life/coffee.jpg",
    alt: "享受一杯好咖啡",
    caption: "咖啡时光激发创造力",
    category: "life",
    icon: "☕"
  },
  {
    src: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    localSrc: "/images/about/life/sports.jpg",
    alt: "晨跑获得新视角",
    caption: "活跃生活带来清晰思维",
    category: "life",
    icon: "🏃"
  },
  {
    src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
    localSrc: "/images/about/work/discussion.jpg",
    alt: "参与技术讨论和头脑风暴",
    caption: "参与技术讨论与头脑风暴",
    category: "work",
    icon: "💭"
  }
];

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
              全栈开发工程师 · AI 应用技术负责人 · FDE（前沿部署工程师）——10 年软件开发经验，专注企业级架构与系统交付、AI 应用工程化与业务流程自动化。
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
            你好，我是一名拥有 10 年软件开发经验的全栈工程师。从 CRM、MES 到企业统一运营管理平台，我长期深耕企业级系统的架构设计与交付落地，业务覆盖智能导购、招投评审辅助、企业知识库等场景，能够独立完成从需求分析、技术方案设计到系统开发、部署准备与客户侧技术协调的完整链路。
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            2025 年起，我创立并运营 OPC（一人公司），专注 AI 应用开发与技术服务。约 3 年的 AI 工程化实践让我沉淀出一套务实的方法论：将业务规则、企业数据与大模型能力有机结合，通过 n8n、Dify 等工具编排工作流，以系统集成与人工复核机制保障结果可靠——让 AI 真正走进业务流程，而不是停留在演示环节。
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            我是蓝耘 MCP 大赛亚军，并持续通过 MisoTech 与自媒体，分享 AI 工程化、自动化工作流与架构实践。我的核心理念很简单：<strong>拒谈概念，只讲落地</strong>。
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            在 MisoTech，我分享的内容遵循三个原则：
          </p>
          <ul className="text-neutral-dark dark:text-dark-neutral-dark">
            <li><strong>硬核评测：</strong> 不做表面功夫。无论 AI 编程工具、图像处理还是知识库系统，我都亲自上手、深入核心功能，在真实场景中验证成色。</li>
            <li><strong>拒绝空谈：</strong> 不堆砌概念。直接告诉你一项技术能做什么、不能做什么、适合谁用、怎么用最好——工程问题，用工程答案回应。</li>
            <li><strong>交付视角：</strong> 站在最终使用者与客户一侧思考。技术再先进，不能稳定交付、不能融入流程，就没有价值。</li>
          </ul>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            写代码之外，我在研究大模型领域的最新进展、打磨自动化工作流，或为下一个交付项目梳理方案。我相信最好的技术是可靠且可交付的——它在业务流程中安静运转，让复杂的事情变简单。
          </p>
        </div>
      </Section>
      
      {/* Skills Section */}
      <Section id="about-skills" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading
          title="技能与专长"
          subtitle="我的技术能力和熟练程度的全面概述。"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {skillsData.map((category, index) => (
            <SkillCategoryComponent
              key={index}
              category={category}
              locale="zh"
            />
          ))}
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
          <div className="absolute left-[7px] md:left-1/2 h-full w-0.5 bg-neutral-light dark:bg-dark-neutral-light transform -translate-x-1/2"></div>

          <div className="space-y-8">
            {experienceData.map((experience, index) => (
              <TimelineItem
                key={experience.id}
                experience={experience}
                locale="zh"
                index={index}
              />
            ))}
          </div>
        </div>
      </Section>
      
      {/* Personal Gallery Section */}
      <Section id="about-gallery" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading
          title="代码之外的生活"
          subtitle="工作探索、生活灵感与持续学习的融合。"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {galleryItems.map((item, index) => (
            <GalleryItem key={index} {...item} />
          ))}
        </div>

        {/* 额外说明文字 */}
        <div className="mt-12 text-center max-w-3xl mx-auto">
          <p className="text-neutral-dark dark:text-dark-neutral-dark text-lg leading-relaxed">
            <strong className="text-neutral-darker dark:text-dark-neutral-darker">除了代码和评测</strong>，我热衷于探索AI技术的边界，与社区分享实践经验，
            并思考如何让复杂的AI工具变得简单易用。我相信，真正的技术创新应该让每个人的生活更美好。
          </p>
          <p className="text-neutral-medium dark:text-dark-neutral-medium text-base mt-4">
            📚 正在阅读 • 🛠️ 测试新工具 • 💡 分享见解
          </p>
        </div>
      </Section>
    </>
  );
}

const GalleryItem: React.FC<GalleryItemProps> = ({ src, localSrc, alt, caption, category, icon }) => {
  const imageSrc = localSrc || src;

  const categoryNames: Record<string, string> = {
    work: '工作',
    life: '生活',
    inspiration: '灵感'
  };

  return (
    <div className="group overflow-hidden rounded-lg shadow-md dark:shadow-neutral-black/20 hover:shadow-xl dark:hover:shadow-neutral-black/30 transition-all duration-300">
      <div className="relative h-56">
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {category && (
          <div className="absolute top-3 right-3 bg-white/90 dark:bg-dark-bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium shadow-sm">
            <span className="mr-1">{icon}</span>
            <span>{categoryNames[category] || category}</span>
          </div>
        )}
      </div>
      {caption && (
        <div className="p-4 bg-white dark:bg-dark-bg-secondary border-t border-neutral-light/30 dark:border-dark-neutral-light/30">
          <p className="text-center text-neutral-dark dark:text-dark-neutral-dark text-sm leading-snug">
            {caption}
          </p>
        </div>
      )}
    </div>
  );
}; 