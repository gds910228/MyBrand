import React from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import ProjectCard from '@/components/ProjectCard';
import { getAllProjects } from '@/services/notion';

export default async function ProjectsPage() {
  // 服务端获取英文项目列表（与 Blog 一致的 Notion Database 读取）
  const projects = await getAllProjects({ language: 'English' });

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
      </Section>

      {/* Projects Grid Section */}
      <Section id="projects-grid">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(projects || []).map((project) => (
            <ProjectCard
              key={project.id}
              title={project.description || project.title}
              description={''}
              imageSrc={project.coverImage}
              tags={project.technologies}
              slug={project.slug}
              locale="en"
              role={project.role}
              client={project.client}
              githubUrl={project.githubUrl}
              className="h-full"
            />
          ))}
          {(!projects || projects.length === 0) && (
            <div className="col-span-full text-neutral-medium">
              No projects found.
            </div>
          )}
        </div>
      </Section>
    </>
  );
}