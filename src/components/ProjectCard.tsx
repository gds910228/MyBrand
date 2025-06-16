"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Project } from '@/data/projects';

export interface ProjectCardProps {
  title: string;
  description: string;
  imageSrc: string;
  tags?: string[];
  slug: string;
  className?: string;
  imageAlt?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  imageSrc,
  tags = [],
  slug,
  className = '',
  imageAlt = '',
}) => {
  const linkHref = `/projects/${slug}`;
  
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
        
        <Link 
          href={linkHref}
          className="inline-block text-primary dark:text-dark-primary font-medium hover:underline"
        >
          查看详情
        </Link>
      </div>
    </motion.div>
  );
};

export default ProjectCard; 