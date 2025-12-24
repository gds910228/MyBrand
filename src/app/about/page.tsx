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
            Hello! I'm a developer focused on building AI products that truly "understand human language." In this era of rapid technological advancement, I've found that many AI tools are powerful but come with high learning barriers and complex interfaces, making them inaccessible to ordinary users. That's why I'm dedicated to creating AI solutions that genuinely understand users, are easy to use, and deliver practical value.
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            My core philosophy is simple: <strong>No buzzwords, just practical solutions</strong>. In a market flooded with AI concepts and terminology, I insist on using the most straightforward language. Through in-depth testing and hardcore reviews, I help users find tools that actually solve real problems. Every review and product recommendation is based on genuine hands-on experience and real-world scenario testing.
          </p>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            At MisoTech, the content I share follows three principles:
          </p>
          <ul className="text-neutral-dark dark:text-dark-neutral-dark">
            <li><strong>Hardcore Reviews:</strong> No superficial coverage. I dive deep into core features and test performance in real scenarios. Whether it's AI coding tools, image generation, or knowledge management, I personally test every aspect comprehensively.</li>
            <li><strong>No Empty Talk:</strong> No big theories, no concept stacking. I tell you directly what this tool can and cannot do, who it's for, and how to use it most effectively.</li>
            <li><strong>User Perspective:</strong> I think from the ordinary user's standpoint. No matter how powerful the technology, if it's not easy to use or learn, it has no value. I focus on real user experience and actual productivity improvements.</li>
          </ul>
          <p className="text-neutral-dark dark:text-dark-neutral-dark">
            When I'm not coding or testing new tools, you'll find me researching the latest developments in AI, exchanging practical insights with the community, or searching for the next AI tool that can truly transform daily work. I believe the best technology should be invisible—working silently in the background to make your life simpler and more efficient.
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
          subtitle="Daily moments of tech exploration and life inspiration."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GalleryItem
            src="https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=1171&q=80"
            alt="Exploring AI technology and future trends"
            caption="Exploring cutting-edge AI technology"
          />

          <GalleryItem
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1173&q=80"
            alt="Deep testing new AI tools"
            caption="In-depth testing of AI tools"
          />

          <GalleryItem
            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
            alt="Sharing with tech community"
            caption="Exchanging practical insights with community"
          />

          <GalleryItem
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
            alt="Reading latest AI research papers"
            caption="Tracking latest AI developments"
          />

          <GalleryItem
            src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1171&q=80"
            alt="Thinking about product ideas in cafe"
            caption="Finding inspiration for efficiency"
          />

          <GalleryItem
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
            alt="Participating in tech discussions"
            caption="Tech discussions and brainstorming"
          />
        </div>

        {/* Additional description text */}
        <div className="mt-12 text-center max-w-3xl mx-auto">
          <p className="text-neutral-dark dark:text-dark-neutral-dark text-lg">
            Beyond code and reviews, I'm passionate about exploring the boundaries of AI technology,
            sharing practical experiences with the community, and thinking about how to make complex
            AI tools simple and accessible. I believe true technological innovation should make everyone's life better.
          </p>
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