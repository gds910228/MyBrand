"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Section from './Section';
import SectionHeading from './SectionHeading';
import ProjectCard from './ProjectCard';
import Button from './Button';
import { getProjectsByLocale } from '@/data/projects';

interface FeaturedProjectsProps {
  locale?: string;
}

const FeaturedProjects: React.FC<FeaturedProjectsProps> = ({ locale = 'en' }) => {
  // 根据传入的locale获取项目数据集
  const projectsData = getProjectsByLocale(locale);
  
  // 获取精选项目
  const featuredProjects = projectsData.filter(project => project.featured);
  
  return (
    <Section id="featured-projects" bgColor="bg-white">
      <SectionHeading
        title={locale === 'zh' ? "精选项目" : "Featured Projects"}
        subtitle={
          locale === 'zh' 
            ? "这里展示了我的一些近期作品，展示了我的技能和专长。" 
            : "Here are some of my recent works that showcase my skills and expertise."
        }
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        {featuredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            title={project.title}
            description={project.subtitle}
            imageSrc={project.coverImage}
            imageAlt={project.title}
            slug={project.slug}
            tags={project.technologies}
            locale={locale}
          />
        ))}
      </div>
      
      <div className="mt-8 sm:mt-10 md:mt-12 text-center">
        <Button href={locale === 'zh' ? "/zh/projects" : "/projects"} variant="outline">
          {locale === 'zh' ? "查看所有项目" : "View All Projects"}
        </Button>
      </div>
    </Section>
  );
};

export default FeaturedProjects; 