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
  categories?: { name: string; label: string }[];
  locale?: string;
  ratingOverall?: number; // 评测总分（0-5，可选）
}

const BlogCard: React.FC<BlogCardProps> = ({
  title,
  excerpt,
  coverImage,
  publishedAt,
  slug,
  categories = [],
  locale = 'en',
  ratingOverall,
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

  // 封面占位回退
  const imgSrc = coverImage || '/images/covers/placeholder.svg';
  
  // 根据locale决定链接路径
  const linkHref = locale === 'zh' ? `/zh/blog/${slug}` : `/blog/${slug}`;
  
  // 评分截断在0-5之间
  const score =
    typeof ratingOverall === 'number' && !Number.isNaN(ratingOverall)
      ? Math.max(0, Math.min(5, ratingOverall))
      : undefined;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass-surface rounded-xl shadow-md overflow-hidden h-full flex flex-col border border-white/20 dark:border-white/10 neon-hover group"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={imgSrc}
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

        {/* 评分摘要（存在评分时显示） */}
        {typeof score === 'number' && score > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i + 1 <= Math.round(score);
                return (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${filled ? 'text-yellow-400' : 'text-neutral-300 dark:text-neutral-600'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.175 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.88 8.72c-.783-.57-.38-1.81.588-1.81H6.93a1 1 0 00.95-.69l1.07-3.292z" />
                  </svg>
                );
              })}
            </div>
            <span className="text-xs text-neutral-medium dark:text-dark-neutral-medium">
              {score.toFixed(1)}/5
            </span>
          </div>
        )}

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