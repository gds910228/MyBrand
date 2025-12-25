import React from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import ProjectCard from '@/components/ProjectCard';
import { getAllProjects } from '@/services/notion';

export default async function ProjectsPage() {
  // 服务端获取英文项目列表（与 Blog 一致的 Notion Database 读取）
  const projects = await getAllProjects({ language: 'English' });

  // 提取所有年份和分类
  const years = Array.from(new Set(projects.map(p => p.year).filter(Boolean)));
  const technologies = Array.from(new Set(projects.flatMap(p => p.technologies || [])));

  return (
    <>
      {/* Hero Section */}
      <Section id="projects-hero" bgColor="bg-neutral-light">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-neutral-darker mb-6">
            My Projects
          </h1>
          <p className="text-lg text-neutral-dark">
            A collection of my work across various domains. Each project represents a unique challenge and solution.
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
                Total Projects
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary dark:text-dark-primary">
                {new Set(projects.flatMap(p => p.technologies || [])).size}
              </div>
              <div className="text-sm text-neutral-medium dark:text-dark-neutral-medium">
                Technologies Used
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary dark:text-dark-primary">
                {years.length}
              </div>
              <div className="text-sm text-neutral-medium dark:text-dark-neutral-medium">
                Years Active
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
              locale="en"
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
                No projects found.
              </div>
            </div>
          )}
        </div>
      </Section>
    </>
  );
}