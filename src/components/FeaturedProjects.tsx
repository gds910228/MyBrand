"use client";

import React, { useEffect, useState } from 'react';
import Section from './Section';
import SectionHeading from './SectionHeading';
import ProjectCard from './ProjectCard';
import Button from './Button';

interface FeaturedProjectsProps {
  locale?: string;
}

type ProjectItem = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  slug: string;
  technologies?: string[];
  featured?: boolean;
  language?: string;
};

const FeaturedProjects: React.FC<FeaturedProjectsProps> = ({ locale = 'en' }) => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const lang = locale === 'zh' ? 'Chinese' : 'English';
    setLoading(true);
    fetch(`/api/projects?language=${encodeURIComponent(lang)}`)
      .then((res) => res.json())
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [locale]);

  // 仅挑选精选项目
  const featuredProjects = (projects || []).filter((p) => !!p.featured);

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

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse h-40 bg-neutral-light/60 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {featuredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              title={project.title}
              description={project.description || ''}
              imageSrc={project.coverImage || ''}
              imageAlt={project.title || ''}
              slug={project.slug}
              tags={project.technologies}
              locale={locale}
            />
          ))}

          {featuredProjects.length === 0 && (
            <div className="col-span-full text-neutral-medium">
              {locale === 'zh' ? "暂无精选项目" : "No featured projects yet."}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 sm:mt-10 md:mt-12 text-center">
        <Button href={locale === 'zh' ? "/zh/projects" : "/projects"} variant="outline">
          {locale === 'zh' ? "查看所有项目" : "View All Projects"}
        </Button>
      </div>
    </Section>
  );
};

export default FeaturedProjects;