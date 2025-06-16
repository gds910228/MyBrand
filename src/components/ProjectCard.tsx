"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ProjectCardProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
  technologies?: string[];
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  imageSrc,
  imageAlt,
  href,
  technologies = [],
}) => {
  return (
    <Link href={href} className="group block overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 h-full">
      <div className="relative h-40 xs:h-48 sm:h-56 md:h-64 overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
        />
      </div>
      <div className="p-4 sm:p-6 bg-white flex flex-col h-full">
        <h3 className="text-lg sm:text-xl font-semibold font-heading text-neutral-darker group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm sm:text-base text-neutral-dark line-clamp-3 flex-grow">
          {description}
        </p>
        
        {technologies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {technologies.slice(0, 3).map((tech) => (
              <span 
                key={tech} 
                className="inline-block px-2 py-1 text-xs rounded-md bg-neutral-light text-neutral-dark"
              >
                {tech}
              </span>
            ))}
            {technologies.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs rounded-md bg-neutral-light text-neutral-dark">
                +{technologies.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProjectCard; 