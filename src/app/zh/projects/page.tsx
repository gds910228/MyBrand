import React from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import ProjectCard from '@/components/ProjectCard';
import { getAllProjects } from '@/services/notion';

export default async function ProjectsPageZh() {
  // 服务端获取中文项目列表（Notion Database）
  const projects = await getAllProjects({ language: 'Chinese' });

  // 提取所有年份
  const years = Array.from(new Set(projects.map(p => p.year).filter(Boolean)));

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

        {/* 项目统计 */}
        {projects && projects.length > 0 && (
          <div className="mt-8 flex justify-center gap-8 flex-wrap">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary dark:text-dark-primary">
                {projects.length}
              </div>
              <div className="text-sm text-neutral-medium dark:text-dark-neutral-medium">
                项目总数
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary dark:text-dark-primary">
                {new Set(projects.flatMap(p => p.technologies || [])).size}
              </div>
              <div className="text-sm text-neutral-medium dark:text-dark-neutral-medium">
                使用技术
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary dark:text-dark-primary">
                {years.length}
              </div>
              <div className="text-sm text-neutral-medium dark:text-dark-neutral-medium">
                年份跨度
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Projects Grid Section */}
      <Section id="projects-grid">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(projects || []).map((project) => (
            <ProjectCard
              key={project.id}
              title={project.description || project.title}
              description={project.title || ''}
              imageSrc={project.coverImage}
              tags={project.technologies}
              slug={project.slug}
              locale="zh"
              role={project.role}
              client={project.client}
              githubUrl={project.githubUrl}
              year={project.year}
              className="h-full"
            />
          ))}
          {(!projects || projects.length === 0) && (
            <div className="col-span-full text-center py-12">
              <div className="text-neutral-medium dark:text-dark-neutral-medium text-lg">
                暂无项目
              </div>
            </div>
          )}
        </div>
      </Section>
    </>
  );
}