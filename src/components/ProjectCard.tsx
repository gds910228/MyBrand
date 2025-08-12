"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

export interface ProjectCardProps {
  title: string;
  description: string;
  imageSrc: string;
  tags?: string[];
  slug: string;
  className?: string;
  imageAlt?: string;
  locale?: string;
  role?: string;
  client?: string;
  githubUrl?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  imageSrc,
  tags = [],
  slug,
  className = '',
  imageAlt = '',
  locale = 'en',
  role,
  client,
  githubUrl,
}) => {
  const linkHref = locale === 'zh' ? `/zh/projects/${slug}` : `/projects/${slug}`;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`bg-white dark:bg-dark-bg-secondary rounded-xl shadow-md overflow-hidden ${className}`}
    >
      <div className="relative h-48 sm:h-56 w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt || title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-2">
          {title}
        </h3>
        <p className="text-neutral-dark dark:text-dark-neutral-dark mb-4">
          {description}
        </p>
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.slice(0, 3).map((tag) => (
              <span 
                key={tag} 
                className="inline-block py-1 px-2 text-xs font-medium rounded-full bg-neutral-light dark:bg-dark-neutral-light text-neutral-dark dark:text-dark-neutral-dark"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="inline-block py-1 px-2 text-xs font-medium rounded-full bg-neutral-light dark:bg-dark-neutral-light text-neutral-dark dark:text-dark-neutral-dark">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
        
        {(role || client || githubUrl) && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2 text-xs text-neutral-medium dark:text-dark-neutral-medium">
              {role && <span className="px-2 py-1 rounded bg-neutral-light dark:bg-dark-neutral-light">{role}</span>}
              {client && <span className="px-2 py-1 rounded bg-neutral-light dark:bg-dark-neutral-light">{client}</span>}
            </div>
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub repository"
                className="text-neutral-medium hover:text-neutral-darker dark:hover:text-dark-neutral-darker"
              >
                <FontAwesomeIcon icon={faGithub} className="w-5 h-5" />
              </a>
            )}
          </div>
        )}
        
        <Link 
          href={linkHref}
          className="inline-block text-primary dark:text-dark-primary font-medium hover:underline"
        >
          {locale === 'zh' ? '查看详情' : 'View Details'}
        </Link>
      </div>
    </motion.div>
  );
};

export default ProjectCard; 