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