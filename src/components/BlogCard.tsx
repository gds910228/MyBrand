"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BlogCardProps {
  title: string;
  excerpt: string;
  date: string;
  imageSrc?: string;
  imageAlt?: string;
  href: string;
  tags?: string[];
  readTime?: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const BlogCard: React.FC<BlogCardProps> = ({
  title,
  excerpt,
  date,
  imageSrc,
  imageAlt = '',
  href,
  tags = [],
  readTime,
}) => {
  return (
    <article className="group h-full flex flex-col">
      <Link href={href} className="block flex-grow">
        {imageSrc && (
          <div className="relative h-40 xs:h-48 sm:h-52 mb-3 sm:mb-4 overflow-hidden rounded-lg">
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
        )}
        <div>
          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {tags.slice(0, 2).map((tag) => (
                <span 
                  key={tag}
                  className="inline-block px-2 py-1 text-xs rounded-md bg-primary-light/10 text-primary-dark"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center text-xs sm:text-sm text-neutral-medium mb-2">
            <span>{formatDate(date)}</span>
            {readTime && (
              <>
                <span className="mx-2">•</span>
                <span>{readTime}</span>
              </>
            )}
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold font-heading text-neutral-darker group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="mt-2 text-sm sm:text-base text-neutral-dark line-clamp-3">{excerpt}</p>
          <div className="mt-4 text-primary font-medium group-hover:underline text-sm sm:text-base">Read more</div>
        </div>
      </Link>
    </article>
  );
};

export default BlogCard; 