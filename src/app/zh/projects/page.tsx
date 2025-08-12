import React from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import ProjectCard from '@/components/ProjectCard';
import { getAllProjects } from '@/services/notion';

export default async function ProjectsPageZh() {
  // 服务端获取中文项目列表（Notion Database）
  const projects = await getAllProjects({ language: 'Chinese' });

  return (
    <>
      {/* Hero Section */}
      <Section id="projects-hero" bgColor="bg-neutral-light">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-6">
            我的项目
          </h1>
          <p className="text-lg text-neutral-dark dark:text-dark-neutral-dark">
            这里汇集了我在不同领域的实践项目，每一个都代表了一次独特的挑战与解决方案。
          </p>
        </div>
      </Section>

      {/* Projects Grid Section */}
      <Section id="projects-grid">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(projects || []).map((project) => (
            <ProjectCard
              key={project.id}
              title={project.title}
              description={project.subtitle || project.description || ''}
              imageSrc={project.coverImage}
              tags={project.technologies}
              slug={project.slug}
              locale="zh"
              className="h-full"
            />
          ))}
          {(!projects || projects.length === 0) && (
            <div className="col-span-full text-neutral-medium dark:text-dark-neutral-medium">
              暂无项目
            </div>
          )}
        </div>
      </Section>
    </>
  );
}