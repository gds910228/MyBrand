"use client";

import React from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import Container from '@/components/Container';
import Image from 'next/image';
import Link from 'next/link';
import { getProjectsByLocale } from '@/data/projects';
import ProjectCard from '@/components/ProjectCard';

export default function ProjectsPage() {
  // 获取英文项目数据
  const projects = getProjectsByLocale('en');
  
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
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              title={project.title} 
              description={project.subtitle}
              imageSrc={project.coverImage}
              tags={project.technologies}
              slug={project.slug}
              locale="en"
              className="h-full"
            />
          ))}
        </div>
      </Section>
    </>
  );
} 