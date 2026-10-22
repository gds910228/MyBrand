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
    alt: "Exploring AI technology and future trends",
    caption: "Exploring cutting-edge AI technology",
    category: "work",
    icon: "🤖"
  },
  {
    src: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1173&q=80",
    localSrc: "/images/about/work/testing-tools.jpg",
    alt: "Deep testing new AI tools",
    caption: "In-depth testing of AI tools",
    category: "work",
    icon: "🔍"
  },
  {
    src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
    localSrc: "/images/about/work/community.jpg",
    alt: "Sharing with tech community",
    caption: "Exchanging practical insights with community",
    category: "work",
    icon: "👥"
  },
  {
    src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
    localSrc: "/images/about/inspiration/learning.jpg",
    alt: "Reading latest AI research papers",
    caption: "Tracking latest AI developments",
    category: "inspiration",
    icon: "📚"
  },
  {
    src: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1171&q=80",
    localSrc: "/images/about/life/cafe-thinking.jpg",
    alt: "Thinking about product ideas in cafe",
    caption: "Finding inspiration for efficiency",
    category: "life",
    icon: "💡"
  },
  {
    src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    localSrc: "/images/about/life/reading.jpg",
    alt: "Reading technical books and documentation",
    caption: "Continuous learning through reading",
    category: "life",
    icon: "📖"
  },
  {
    src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    localSrc: "/images/about/life/coffee.jpg",
    alt: "Enjoying a good cup of coffee",
    caption: "Coffee breaks fuel creativity",
    category: "life",
    icon: "☕"
  },
  {
    src: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    localSrc: "/images/about/life/sports.jpg",
    alt: "Morning run for fresh perspective",
    caption: "Active lifestyle for clear mind",
    category: "life",
    icon: "🏃"
  },
  {
    src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
    localSrc: "/images/about/work/discussion.jpg",
    alt: "Participating in tech discussions",
    caption: "Tech discussions and brainstorming",
    category: "work",
    icon: "💭"
  }
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <Section id="about-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-6">
              About Me
            </h1>
            <p className="text-lg text-neutral-dark dark:text-dark-neutral-dark">
              Full-Stack Engineer · AI Engineering Lead · FDE (Forward Deployed Engineer) — 10 years of software development across enterprise architecture and system delivery, AI application engineering, and business process automation.
            </p>
          </div>
          <div className="relative h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=755&q=80"
              alt="Person working on a laptop in a creative workspace"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </Section>
      
      {/* Story & Philosophy Section */}
      <Section id="about-story">
        <SectionHeading
          title="My Story & Philosophy"
          subtitle="A glimpse into my journey and the principles that guide my work."
        />
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            Hello — I'm a full-stack engineer with 10 years of software development experience. From CRM and MES to unified enterprise operations platforms, I've spent my career architecting and delivering enterprise-grade systems across scenarios like AI-assisted shopping guides, bidding-review support and enterprise knowledge bases — owning the full chain from requirement analysis and solution design through development, deployment preparation and client-side technical coordination.
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            Since 2025 I've been running my own one-person company (OPC), focused on AI application development and technical services. Three years of hands-on AI engineering have shaped a pragmatic methodology: combine business rules, enterprise data and LLM capabilities; orchestrate workflows with n8n and Dify; and guard reliability through system integration and human-in-the-loop review — so AI actually enters business processes instead of stopping at the demo stage.
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            I'm the runner-up of the Lanyun MCP Competition, and I share AI engineering, automation workflow and architecture practices through MisoTech and my own media channels. My core philosophy is simple: <strong>no buzzwords, just delivery</strong>.
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            At MisoTech, the content I share follows three principles:
          </p>
          <ul className="text-neutral-dark dark:text-dark-neutral-dark">
            <li><strong>Hardcore Reviews:</strong> No superficial coverage. From AI coding tools to image processing and knowledge bases, I test core features hands-on and verify them in real scenarios.</li>
            <li><strong>No Empty Talk:</strong> No concept stacking. I tell you directly what a technology can and cannot do, who it's for, and how to get the most out of it — engineering questions deserve engineering answers.</li>
            <li><strong>Delivery Perspective:</strong> I think from the user's and the client's side. However advanced, technology that can't be delivered reliably and woven into real workflows has no value.</li>
          </ul>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            Beyond code, I'm tracking the latest advances in large models, refining automation workflows, or scoping the next delivery. I believe the best technology is reliable and deliverable — quietly running inside business processes, turning complexity into simplicity.
          </p>
        </div>
      </Section>
      
      {/* Skills Section */}
      <Section id="about-skills" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading
          title="Skills & Expertise"
          subtitle="A comprehensive overview of my technical skills and proficiency levels."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {skillsData.map((category, index) => (
            <SkillCategoryComponent
              key={index}
              category={category}
              locale="en"
            />
          ))}
        </div>

        <div className="mt-12 text-center text-neutral-medium dark:text-dark-neutral-medium">
          <p>* Skill levels are based on relative proficiency and experience</p>
        </div>
      </Section>
      
      {/* Experience Timeline Section */}
      <Section id="about-experience">
        <SectionHeading
          title="Work Experience"
          subtitle="My professional journey through the tech industry."
        />

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] md:left-1/2 h-full w-0.5 bg-neutral-light dark:bg-dark-neutral-light transform -translate-x-1/2"></div>

          <div className="space-y-8">
            {experienceData.map((experience, index) => (
              <TimelineItem
                key={experience.id}
                experience={experience}
                locale="en"
                index={index}
              />
            ))}
          </div>
        </div>
      </Section>
      
      {/* Personal Gallery Section */}
      <Section id="about-gallery" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading
          title="Beyond the Code"
          subtitle="A blend of work exploration, life inspirations, and continuous learning."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {galleryItems.map((item, index) => (
            <GalleryItem key={index} {...item} />
          ))}
        </div>

        {/* Additional description text */}
        <div className="mt-12 text-center max-w-3xl mx-auto">
          <p className="text-neutral-dark dark:text-dark-neutral-dark text-lg leading-relaxed">
            <strong className="text-neutral-darker dark:text-dark-neutral-darker">Beyond code and reviews</strong>, I'm passionate about exploring the boundaries of AI technology,
            sharing practical experiences with the community, and thinking about how to make complex
            AI tools simple and accessible. I believe true technological innovation should make everyone's life better.
          </p>
          <p className="text-neutral-medium dark:text-dark-neutral-medium text-base mt-4">
            📚 Currently reading • 🛠️ Testing new tools • 💡 Sharing insights
          </p>
        </div>
      </Section>
    </>
  );
}

const GalleryItem: React.FC<GalleryItemProps> = ({ src, localSrc, alt, caption, category, icon }) => {
  const imageSrc = localSrc || src;

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
            <span className="capitalize">{category}</span>
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