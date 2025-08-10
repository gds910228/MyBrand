"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { format, isValid, parseISO } from 'date-fns';

export interface BlogCardProps {
  title: string;
  excerpt: string;
  coverImage: string;
  publishedAt: string;
  slug: string;
  categories?: { name: string, label: string }[];
  locale?: string;
}

const BlogCard: React.FC<BlogCardProps> = ({
  title,
  excerpt,
  coverImage,
  publishedAt,
  slug,
  categories = [],
  locale = 'en'
}) => {
  // 格式化发布日期
  let formattedDate = publishedAt;
  try {
    const date = parseISO(publishedAt);
    if (isValid(date)) {
      formattedDate = format(date, 'yyyy-MM-dd');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
  }
  
  // 根据locale决定链接路径
  const linkHref = locale === 'zh' ? `/zh/blog/${slug}` : `/blog/${slug}`;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass-surface rounded-xl shadow-md overflow-hidden h-full flex flex-col border border-white/20 dark:border-white/10 neon-hover"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={coverImage}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.slice(0, 2).map((cat) => (
              <span 
                key={cat.name}
                className="inline-block py-1 px-2 text-xs font-medium rounded-full bg-neutral-light dark:bg-dark-neutral-light text-neutral-dark dark:text-dark-neutral-dark"
              >
                {cat.label}
              </span>
            ))}
          </div>
        )}
        
        <h3 className="text-xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-2">
          {title}
        </h3>
        
        <p className="text-neutral-dark dark:text-dark-neutral-dark mb-4 flex-grow">
          {excerpt}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="text-sm text-neutral-medium dark:text-dark-neutral-medium">
            {formattedDate}
          </span>
          
          <Link 
            href={linkHref}
            className="inline-block text-primary dark:text-dark-primary font-medium hover:underline"
          >
            {locale === 'zh' ? '阅读更多' : 'Read More'}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default BlogCard; 