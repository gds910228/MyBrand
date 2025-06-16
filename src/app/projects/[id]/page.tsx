"use client";

import React from 'react';
import { notFound } from 'next/navigation';
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
    fullDescription: `
      <p>This e-commerce platform was developed to provide small businesses with an affordable yet powerful solution to sell their products online. The platform includes comprehensive product management, inventory tracking, and order processing capabilities.</p>
      
      <p>Key features include:</p>
      <ul>
        <li>User authentication and profile management</li>
        <li>Product catalog with categories and search functionality</li>
        <li>Shopping cart and wishlist</li>
        <li>Secure checkout process with multiple payment options</li>
        <li>Order tracking and history</li>
        <li>Admin dashboard for product and order management</li>
        <li>Analytics and reporting tools</li>
      </ul>
      
      <p>The frontend was built using Next.js and React, providing a fast and responsive user experience. The backend uses Node.js with Express, connected to a MongoDB database for data storage. Stripe was integrated for payment processing, ensuring secure transactions.</p>
      
      <p>One of the main challenges was implementing a real-time inventory system that could handle multiple concurrent users without overselling products. This was solved by implementing a reservation system during checkout and using database transactions to ensure data consistency.</p>
    `,
    thumbnail: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    images: [
      'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      'https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1332&q=80',
      'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80'
    ],
    technologies: ['Next.js', 'React', 'Node.js', 'MongoDB', 'Stripe'],
    role: 'Lead Developer',
    responsibilities: [
      'Led a team of 3 developers throughout the project lifecycle',
      'Designed the database schema and API architecture',
      'Implemented the product management and checkout systems',
      'Integrated Stripe payment processing',
      'Conducted code reviews and ensured code quality'
    ],
    year: '2023',
    client: 'RetailTech Solutions'
  },
  {
    id: 'task-management',
    title: 'Task Management App',
    description: 'A collaborative task management application that helps teams organize and track their work with real-time updates.',
    fullDescription: `
      <p>This task management application was designed to help remote teams collaborate effectively and stay organized. The app provides a visual interface for creating, assigning, and tracking tasks across different projects and team members.</p>
      
      <p>Key features include:</p>
      <ul>
        <li>Kanban board view for visualizing task progress</li>
        <li>Task creation with detailed descriptions, attachments, and due dates</li>
        <li>Task assignment and reassignment</li>
        <li>Comment system for team communication</li>
        <li>Real-time updates and notifications</li>
        <li>Project organization and filtering</li>
        <li>Time tracking and reporting</li>
      </ul>
      
      <p>The application was built using React for the frontend, with Redux for state management. Firebase was used for the backend, providing real-time database capabilities, authentication, and file storage. Material UI was used for the component library, ensuring a consistent and professional look.</p>
      
      <p>A significant challenge was implementing the real-time collaboration features without causing conflicts when multiple users edit the same task. This was addressed by implementing optimistic UI updates with conflict resolution strategies.</p>
    `,
    thumbnail: 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
    images: [
      'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
      'https://images.unsplash.com/photo-1611224885990-ab7363d1f2a4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1039&q=80',
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1172&q=80'
    ],
    technologies: ['React', 'Firebase', 'Material UI', 'Redux'],
    role: 'Frontend Developer',
    responsibilities: [
      'Designed and implemented the Kanban board interface',
      'Built the task creation and editing components',
      'Implemented real-time updates using Firebase',
      'Created the notification system',
      'Optimized performance for handling large numbers of tasks'
    ],
    year: '2022',
    client: 'Internal Tool'
  },
  {
    id: 'fitness-tracker',
    title: 'Fitness Tracker',
    description: 'A mobile-first web application for tracking workouts, nutrition, and fitness progress with data visualization.',
    fullDescription: `
      <p>This fitness tracking application was created to help users monitor their fitness journey, track workouts, log nutrition, and visualize their progress over time. The app was designed with a mobile-first approach to ensure a great experience on smartphones.</p>
      
      <p>Key features include:</p>
      <ul>
        <li>Workout logging with exercise library</li>
        <li>Custom workout creation</li>
        <li>Nutrition tracking with calorie and macro counting</li>
        <li>Body measurement tracking</li>
        <li>Progress visualization with charts and graphs</li>
        <li>Goal setting and achievement tracking</li>
        <li>Social sharing capabilities</li>
      </ul>
      
      <p>The application was built using React Native for cross-platform compatibility, with an Express backend API and PostgreSQL database for data storage. Chart.js was used for creating interactive and responsive data visualizations.</p>
      
      <p>A major challenge was designing an intuitive interface that could handle the complex data entry required for tracking workouts and nutrition while remaining user-friendly on small screens. This was addressed through careful UX design and extensive user testing.</p>
    `,
    thumbnail: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    images: [
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80'
    ],
    technologies: ['React Native', 'Express', 'PostgreSQL', 'Chart.js'],
    role: 'Full Stack Developer',
    responsibilities: [
      'Developed both frontend and backend components',
      'Designed and implemented the database schema',
      'Created the data visualization components',
      'Implemented user authentication and profile management',
      'Optimized the application for mobile performance'
    ],
    year: '2022',
    client: 'FitTech Innovations'
  },
  {
    id: 'ai-content-generator',
    title: 'AI Content Generator',
    description: 'An AI-powered content generation tool that helps marketers create engaging copy for various platforms.',
    fullDescription: `
      <p>This AI content generator was developed to help marketing teams create high-quality content efficiently. The tool uses natural language processing to generate blog posts, social media updates, email campaigns, and other marketing materials based on user inputs.</p>
      
      <p>Key features include:</p>
      <ul>
        <li>Content generation for multiple formats (blogs, social media, emails)</li>
        <li>Tone and style customization</li>
        <li>Industry-specific terminology options</li>
        <li>Content editing and refinement tools</li>
        <li>SEO optimization suggestions</li>
        <li>Content performance analytics</li>
        <li>Team collaboration features</li>
      </ul>
      
      <p>The application was built using Python with TensorFlow for the AI model, with a React frontend for the user interface. FastAPI was used to create the backend API that connects the frontend to the AI model.</p>
      
      <p>The biggest challenge was training the AI model to generate content that was not only grammatically correct but also engaging and relevant to specific industries. This required extensive training data curation and model fine-tuning.</p>
    `,
    thumbnail: 'https://images.unsplash.com/photo-1673187136588-4a9ccd4c8e7e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    images: [
      'https://images.unsplash.com/photo-1673187136588-4a9ccd4c8e7e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      'https://images.unsplash.com/photo-1526378800651-c32d170fe6f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80'
    ],
    technologies: ['Python', 'TensorFlow', 'React', 'FastAPI'],
    responsibilities: [
      'Designed and implemented the natural language processing model',
      'Created the content generation algorithms',
      'Developed the API for frontend-backend communication',
      'Trained and fine-tuned the AI model on industry-specific datasets',
      'Implemented content quality evaluation metrics'
    ],
    role: 'Machine Learning Engineer',
    year: '2021',
    client: 'MarketingAI Inc.'
  },
  {
    id: 'portfolio-website',
    title: 'Portfolio Website',
    description: 'A personal portfolio website showcasing projects, skills, and blog posts with a modern design.',
    fullDescription: `
      <p>This portfolio website was designed to showcase my work, skills, and thoughts in a clean, modern, and professional manner. The site serves as both a personal branding tool and a platform for sharing knowledge through blog posts.</p>
      
      <p>Key features include:</p>
      <ul>
        <li>Responsive design that works on all devices</li>
        <li>Project showcase with detailed case studies</li>
        <li>Skills and experience presentation</li>
        <li>Blog platform for sharing insights</li>
        <li>Contact information and form</li>
        <li>Performance optimized for fast loading</li>
        <li>SEO-friendly structure</li>
      </ul>
      
      <p>The website was built using Next.js for server-side rendering and optimal performance, with Tailwind CSS for styling. Content is managed through Notion, which serves as a headless CMS through its API.</p>
      
      <p>A unique aspect of this project was implementing the Notion API integration, which allows for easy content updates without having to modify code or deploy changes.</p>
    `,
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=755&q=80',
    images: [
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=755&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1115&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
    ],
    technologies: ['Next.js', 'Tailwind CSS', 'Notion API'],
    role: 'Designer & Developer',
    responsibilities: [
      'Designed the website layout and user experience',
      'Developed the frontend using Next.js and Tailwind CSS',
      'Implemented the Notion API integration',
      'Optimized performance and SEO',
      'Created the responsive design for all devices'
    ],
    year: '2021',
    client: 'Personal Project'
  }
];

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = projectsData.find(p => p.id === params.id);
  
  if (!project) {
    notFound();
  }
  
  return (
    <>
      {/* Hero Section */}
      <Section id="project-hero" bgColor="bg-neutral-light">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="mb-2">
              <Link href="/projects" className="inline-flex items-center text-primary hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Projects
              </Link>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-neutral-darker mb-4">
              {project.title}
            </h1>
            <div className="flex items-center mb-6">
              <span className="inline-block px-3 py-1 text-sm font-medium text-primary-dark bg-primary-light/20 rounded-full mr-3">
                {project.year}
              </span>
              <span className="text-neutral-dark">
                Client: {project.client}
              </span>
            </div>
            <p className="text-lg text-neutral-dark">
              {project.description}
            </p>
          </div>
          <div className="relative h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={project.thumbnail}
              alt={project.title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </Section>
      
      {/* Project Details Section */}
      <Section id="project-details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="md:col-span-2">
            <SectionHeading 
              title="Project Overview" 
              subtitle="The challenge, approach, and solution."
            />
            
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: project.fullDescription }} />
            
            {/* Project Images */}
            <div className="mt-12">
              <h3 className="text-2xl font-semibold font-heading text-neutral-darker mb-6">Project Gallery</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.images.map((image, index) => (
                  <div key={index} className="relative h-64 rounded-lg overflow-hidden shadow-md">
                    <Image
                      src={image}
                      alt={`${project.title} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div>
            <div className="bg-neutral-light rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold font-heading text-neutral-darker mb-4">Project Details</h3>
              
              <div className="space-y-6">
                {/* Role */}
                <div>
                  <h4 className="text-sm uppercase tracking-wider text-neutral-medium mb-2">My Role</h4>
                  <p className="font-medium">{project.role}</p>
                </div>
                
                {/* Responsibilities */}
                <div>
                  <h4 className="text-sm uppercase tracking-wider text-neutral-medium mb-2">Responsibilities</h4>
                  <ul className="list-disc list-inside space-y-1 text-neutral-dark">
                    {project.responsibilities.map((responsibility, index) => (
                      <li key={index}>{responsibility}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Technologies */}
                <div>
                  <h4 className="text-sm uppercase tracking-wider text-neutral-medium mb-2">Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span 
                        key={tech} 
                        className="px-3 py-1 bg-white text-neutral-dark text-sm rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Year */}
                <div>
                  <h4 className="text-sm uppercase tracking-wider text-neutral-medium mb-2">Year</h4>
                  <p>{project.year}</p>
                </div>
                
                {/* Client */}
                <div>
                  <h4 className="text-sm uppercase tracking-wider text-neutral-medium mb-2">Client</h4>
                  <p>{project.client}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
      
      {/* Next Project Section */}
      <Section id="next-project" bgColor="bg-neutral-light">
        <div className="text-center">
          <h3 className="text-2xl font-semibold font-heading text-neutral-darker mb-6">Explore More Projects</h3>
          <Link href="/projects" className="inline-block px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors">
            View All Projects
          </Link>
        </div>
      </Section>
    </>
  );
} 