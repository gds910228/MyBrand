"use client";

import React, { useState } from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import ProjectCard from '@/components/ProjectCard';
import ContactCTA from '@/components/ContactCTA';
import { projectsData } from '@/data/projects';

// 项目类型定义
type ProjectCategory = 'all' | 'web' | 'mobile' | 'design';

export default function ProjectsPageZh() {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('all');
  
  const filteredProjects = activeCategory === 'all' 
    ? projectsData 
    : projectsData.filter(project => project.category === activeCategory);

  return (
    <>
      {/* Hero Section */}
      <Section id="projects-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading 
          title="我的项目" 
          subtitle="探索我的作品集和最新项目。"
          centered
        />
        
        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-8 mb-12">
          <CategoryButton 
            category="all" 
            label="全部" 
            active={activeCategory === 'all'} 
            onClick={() => setActiveCategory('all')} 
          />
          <CategoryButton 
            category="web" 
            label="网页开发" 
            active={activeCategory === 'web'} 
            onClick={() => setActiveCategory('web')} 
          />
          <CategoryButton 
            category="mobile" 
            label="移动应用" 
            active={activeCategory === 'mobile'} 
            onClick={() => setActiveCategory('mobile')} 
          />
          <CategoryButton 
            category="design" 
            label="UI/UX设计" 
            active={activeCategory === 'design'} 
            onClick={() => setActiveCategory('design')} 
          />
        </div>
      </Section>
      
      {/* Projects Grid */}
      <Section id="projects-grid">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-dark dark:text-dark-neutral-dark text-lg">
              未找到此类别下的项目。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id}
                title={project.title}
                description={project.subtitle}
                imageSrc={project.coverImage}
                tags={project.technologies}
                slug={project.slug}
                locale="zh"
                className="h-full"
              />
            ))}
          </div>
        )}
      </Section>
      
      <ContactCTA />
    </>
  );
}

// Category Button Component
interface CategoryButtonProps {
  category: ProjectCategory;
  label: string;
  active: boolean;
  onClick: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ category, label, active, onClick }) => {
  return (
    <button
      className={`px-4 py-2 rounded-full font-medium transition-colors ${
        active
          ? 'bg-primary dark:bg-dark-primary text-white'
          : 'bg-neutral-light dark:bg-dark-neutral-light text-neutral-dark dark:text-dark-neutral-dark hover:bg-neutral-muted hover:dark:bg-dark-neutral-muted'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}; 