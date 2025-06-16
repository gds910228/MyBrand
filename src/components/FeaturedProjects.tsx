"use client";

import React from 'react';
import Section from './Section';
import SectionHeading from './SectionHeading';
import ProjectCard from './ProjectCard';
import Button from './Button';

// Mock data (in a real app, this would come from Notion API)
const featuredProjects = [
  {
    id: '1',
    title: 'E-commerce Platform',
    description: 'A modern e-commerce platform built with Next.js, featuring a responsive design, product filtering, and secure checkout.',
    imageSrc: 'https://images.unsplash.com/photo-1661956602116-aa6865609028?ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=764&q=80',
    imageAlt: 'E-commerce platform screenshot',
    slug: 'e-commerce-platform',
    technologies: ['Next.js', 'React', 'Tailwind CSS', 'Stripe'],
  },
  {
    id: '2',
    title: 'Portfolio Website',
    description: 'A minimalist portfolio website for a photographer, showcasing their work with a clean and elegant design.',
    imageSrc: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    imageAlt: 'Portfolio website screenshot',
    slug: 'portfolio-website',
    technologies: ['React', 'GSAP', 'Styled Components'],
  },
];

const FeaturedProjects: React.FC = () => {
  return (
    <Section id="featured-projects" bgColor="bg-white">
      <SectionHeading
        title="Featured Projects"
        subtitle="Here are some of my recent works that showcase my skills and expertise."
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        {featuredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            title={project.title}
            description={project.description}
            imageSrc={project.imageSrc}
            imageAlt={project.imageAlt}
            href={`/projects/${project.slug}`}
            technologies={project.technologies}
          />
        ))}
      </div>
      
      <div className="mt-8 sm:mt-10 md:mt-12 text-center">
        <Button href="/projects" variant="outline">
          View All Projects
        </Button>
      </div>
    </Section>
  );
};

export default FeaturedProjects; 