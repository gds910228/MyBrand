"use client";

import React from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import Container from '@/components/Container';
import Image from 'next/image';
import Link from 'next/link';

// 模拟项目数据
const projectsData = [
  {
    id: 'ecommerce-platform',
    title: 'E-Commerce Platform',
    description: 'A full-featured e-commerce platform built with Next.js, supporting product management, cart functionality, and secure checkout.',
    thumbnail: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    technologies: ['Next.js', 'React', 'Node.js', 'MongoDB', 'Stripe'],
    role: 'Lead Developer',
    year: '2023'
  },
  {
    id: 'task-management',
    title: 'Task Management App',
    description: 'A collaborative task management application that helps teams organize and track their work with real-time updates.',
    thumbnail: 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
    technologies: ['React', 'Firebase', 'Material UI', 'Redux'],
    role: 'Frontend Developer',
    year: '2022'
  },
  {
    id: 'fitness-tracker',
    title: 'Fitness Tracker',
    description: 'A mobile-first web application for tracking workouts, nutrition, and fitness progress with data visualization.',
    thumbnail: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    technologies: ['React Native', 'Express', 'PostgreSQL', 'Chart.js'],
    role: 'Full Stack Developer',
    year: '2022'
  },
  {
    id: 'ai-content-generator',
    title: 'AI Content Generator',
    description: 'An AI-powered content generation tool that helps marketers create engaging copy for various platforms.',
    thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1965&q=80',
    technologies: ['Python', 'TensorFlow', 'React', 'FastAPI'],
    role: 'Machine Learning Engineer',
    year: '2021'
  },
  {
    id: 'portfolio-website',
    title: 'Portfolio Website',
    description: 'A personal portfolio website showcasing projects, skills, and blog posts with a modern design.',
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=755&q=80',
    technologies: ['Next.js', 'Tailwind CSS', 'Notion API'],
    role: 'Designer & Developer',
    year: '2021'
  }
];

export default function ProjectsPage() {
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
      
      {/* Projects List Section */}
      <Section id="projects-list">
        <div className="space-y-16">
          {projectsData.map((project) => (
            <ProjectListItem key={project.id} project={project} />
          ))}
        </div>
      </Section>
    </>
  );
}

interface ProjectProps {
  project: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    technologies: string[];
    role: string;
    year: string;
  };
}

const ProjectListItem: React.FC<ProjectProps> = ({ project }) => {
  return (
    <div className="group">
      <Link href={`/projects/${project.id}`} className="block">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Project Thumbnail */}
          <div className="relative h-64 md:h-full rounded-lg overflow-hidden shadow-md">
            <Image
              src={project.thumbnail}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          
          {/* Project Details */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-semibold font-heading text-neutral-darker group-hover:text-primary transition-colors">
                {project.title}
              </h2>
              <span className="text-sm font-medium bg-neutral-light px-3 py-1 rounded-full">
                {project.year}
              </span>
            </div>
            
            <p className="text-neutral-dark">{project.description}</p>
            
            <div>
              <h3 className="text-sm uppercase tracking-wider text-neutral-medium mb-2">Role</h3>
              <p className="font-medium">{project.role}</p>
            </div>
            
            <div>
              <h3 className="text-sm uppercase tracking-wider text-neutral-medium mb-2">Technologies</h3>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span 
                    key={tech} 
                    className="px-3 py-1 bg-neutral-light text-neutral-dark text-sm rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="pt-2">
              <span className="inline-flex items-center text-primary font-medium group-hover:underline">
                View Project Details
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}; 