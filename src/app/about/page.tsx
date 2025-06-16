"use client";

import React from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import Container from '@/components/Container';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <Section id="about-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-6">
              About Me
            </h1>
            <p className="text-lg text-neutral-dark dark:text-dark-neutral-dark">
              Get to know more about my journey, skills, and what drives me as a developer and creator.
            </p>
          </div>
          <div className="relative h-64 md:h-80 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=755&q=80"
              alt="Person working on a laptop in a creative workspace"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </Section>
      
      {/* Story & Philosophy Section */}
      <Section id="about-story">
        <SectionHeading 
          title="My Story & Philosophy" 
          subtitle="A glimpse into my journey and the principles that guide my work."
        />
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            Hello! I'm a passionate full-stack developer with a love for creating clean, user-friendly, and impactful digital experiences. My journey in tech began over 5 years ago when I built my first website out of curiosity. That small project ignited a passion that has only grown stronger with time.
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            After graduating with a degree in Computer Science, I've worked with startups and established companies alike, helping them build products that users love. Along the way, I've developed a deep appreciation for the intersection of technology, design, and human psychology.
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            My approach to development is guided by a few core principles:
          </p>
          <ul className="text-neutral-dark dark:text-dark-neutral-dark">
            <li><strong>User-Centered Design:</strong> I believe that technology should serve people, not the other way around. Every line of code I write is with the end user in mind.</li>
            <li><strong>Continuous Learning:</strong> The tech landscape evolves rapidly, and I'm committed to growing with it. I dedicate time each week to learning new skills and refining existing ones.</li>
            <li><strong>Quality Over Quantity:</strong> I prefer doing fewer things exceptionally well rather than many things adequately. This philosophy applies to both my code and my projects.</li>
            <li><strong>Collaborative Spirit:</strong> The best products are built by diverse teams working together. I value open communication, constructive feedback, and shared success.</li>
          </ul>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            When I'm not coding, you'll find me hiking in nature, experimenting with new recipes, or diving into a good book. These activities help me maintain perspective and bring fresh ideas to my technical work.
          </p>
        </div>
      </Section>
      
      {/* Skills Section */}
      <Section id="about-skills" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading 
          title="Skills & Expertise" 
          subtitle="A comprehensive overview of my technical skills and proficiency levels."
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {/* Frontend Skills */}
          <div>
            <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">Frontend Development</h3>
            <div className="space-y-4">
              <SkillBar skill="React.js" level={90} />
              <SkillBar skill="Next.js" level={85} />
              <SkillBar skill="TypeScript" level={80} />
              <SkillBar skill="HTML/CSS" level={95} />
              <SkillBar skill="Tailwind CSS" level={90} />
              <SkillBar skill="Redux" level={75} />
            </div>
          </div>
          
          {/* Backend Skills */}
          <div>
            <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">Backend Development</h3>
            <div className="space-y-4">
              <SkillBar skill="Node.js" level={85} />
              <SkillBar skill="Express" level={80} />
              <SkillBar skill="MongoDB" level={75} />
              <SkillBar skill="PostgreSQL" level={70} />
              <SkillBar skill="GraphQL" level={65} />
              <SkillBar skill="REST API Design" level={85} />
            </div>
          </div>
          
          {/* Tools & Others */}
          <div>
            <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">Tools & Platforms</h3>
            <div className="space-y-4">
              <SkillBar skill="Git & GitHub" level={90} />
              <SkillBar skill="Docker" level={70} />
              <SkillBar skill="AWS" level={65} />
              <SkillBar skill="Vercel" level={85} />
              <SkillBar skill="Figma" level={75} />
              <SkillBar skill="Jest" level={80} />
            </div>
          </div>
          
          {/* Soft Skills */}
          <div>
            <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">Soft Skills</h3>
            <div className="space-y-4">
              <SkillBar skill="Problem Solving" level={95} />
              <SkillBar skill="Communication" level={90} />
              <SkillBar skill="Team Collaboration" level={85} />
              <SkillBar skill="Project Management" level={80} />
              <SkillBar skill="Mentoring" level={75} />
              <SkillBar skill="Adaptability" level={90} />
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center text-neutral-medium dark:text-dark-neutral-medium">
          <p>* Skill levels are based on relative proficiency and experience</p>
        </div>
      </Section>
      
      {/* Experience Timeline Section */}
      <Section id="about-experience">
        <SectionHeading 
          title="Work Experience" 
          subtitle="My professional journey through the tech industry."
        />
        
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-0 md:left-1/2 h-full w-0.5 bg-neutral-light dark:bg-dark-neutral-light transform -translate-x-1/2"></div>
          
          <div className="space-y-12">
            <TimelineItem 
              year="2022 - Present"
              title="Senior Frontend Developer"
              company="TechVision Inc."
              description="Lead the development of the company's flagship SaaS product, managing a team of 4 developers. Implemented new features that increased user engagement by 35%."
              isLeft={true}
            />
            
            <TimelineItem 
              year="2019 - 2022"
              title="Full Stack Developer"
              company="InnovateSoft"
              description="Worked on multiple client projects using React, Node.js, and MongoDB. Designed and implemented RESTful APIs and integrated third-party services."
              isLeft={false}
            />
            
            <TimelineItem 
              year="2017 - 2019"
              title="Web Developer"
              company="CreativeWeb Solutions"
              description="Developed responsive websites for clients across various industries. Collaborated with designers to implement pixel-perfect UIs."
              isLeft={true}
            />
            
            <TimelineItem 
              year="2016 - 2017"
              title="Junior Developer"
              company="StartupHub"
              description="Assisted in the development of web applications. Gained experience in agile methodologies and collaborative development workflows."
              isLeft={false}
            />
          </div>
        </div>
      </Section>
      
      {/* Personal Gallery Section */}
      <Section id="about-gallery" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading 
          title="Beyond the Code" 
          subtitle="A glimpse into my life outside of programming."
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GalleryItem 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80"
            alt="Collaborative workspace with team members"
            caption="Collaborating with my amazing team"
          />
          
          <GalleryItem 
            src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1173&q=80"
            alt="Person hiking in mountains"
            caption="Weekend hiking adventures"
          />
          
          <GalleryItem 
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
            alt="Person reading a book in a cozy setting"
            caption="Unwinding with a good book"
          />
          
          <GalleryItem 
            src="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
            alt="Laptop with code on screen and coffee"
            caption="Late night coding sessions"
          />
          
          <GalleryItem 
            src="https://images.unsplash.com/photo-1511988617509-a57c8a288659?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80"
            alt="Person speaking at a tech conference"
            caption="Speaking at a tech conference"
          />
          
          <GalleryItem 
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
            alt="Whiteboard with project planning notes"
            caption="Planning the next big project"
          />
        </div>
      </Section>
    </>
  );
}

// Skill Bar Component
interface SkillBarProps {
  skill: string;
  level: number;
}

const SkillBar: React.FC<SkillBarProps> = ({ skill, level }) => {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-medium text-neutral-darker dark:text-dark-neutral-darker">{skill}</span>
        <span className="text-sm text-neutral-medium dark:text-dark-neutral-medium">{level}%</span>
      </div>
      <div className="h-2 bg-neutral-light dark:bg-dark-neutral-light rounded-full">
        <div 
          className="h-full bg-primary dark:bg-dark-primary rounded-full" 
          style={{ width: `${level}%` }}
        ></div>
      </div>
    </div>
  );
};

// Timeline Item Component
interface TimelineItemProps {
  year: string;
  title: string;
  company: string;
  description: string;
  isLeft: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ year, title, company, description, isLeft }) => {
  return (
    <div className={`relative ${isLeft ? 'md:pr-12' : 'md:pl-12'} md:w-1/2 ${isLeft ? 'md:ml-0 md:mr-auto' : 'md:ml-auto md:mr-0'}`}>
      {/* Dot on the timeline */}
      <div className="hidden md:block absolute top-5 w-4 h-4 rounded-full bg-primary dark:bg-dark-primary border-4 border-white dark:border-dark-bg-primary" style={{ 
        [isLeft ? 'right' : 'left']: '-8px',
      }}></div>
      
      <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-md dark:shadow-neutral-black/20">
        <span className="inline-block px-3 py-1 mb-4 text-sm font-medium text-primary-dark dark:text-dark-primary-dark bg-primary-light/20 dark:bg-dark-primary-light/20 rounded-full">
          {year}
        </span>
        <h3 className="text-xl font-semibold font-heading text-neutral-darker dark:text-dark-neutral-darker">{title}</h3>
        <p className="text-primary dark:text-dark-primary font-medium mt-1">{company}</p>
        <p className="mt-3 text-neutral-dark dark:text-dark-neutral-dark">{description}</p>
      </div>
    </div>
  );
};

// Gallery Item Component
interface GalleryItemProps {
  src: string;
  alt: string;
  caption?: string;
}

const GalleryItem: React.FC<GalleryItemProps> = ({ src, alt, caption }) => {
  return (
    <div className="overflow-hidden rounded-lg shadow-md dark:shadow-neutral-black/20">
      <div className="relative h-64">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      {caption && (
        <div className="p-4 bg-white dark:bg-dark-bg-secondary">
          <p className="text-center text-neutral-dark dark:text-dark-neutral-dark">{caption}</p>
        </div>
      )}
    </div>
  );
}; 