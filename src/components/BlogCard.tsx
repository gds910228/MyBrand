"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import FallbackImage from '@/components/FallbackImage';
import { motion } from 'framer-motion';
import { format, isValid, parseISO } from 'date-fns';
import { transitions, easing } from '@/styles/animations';

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
      transition={{ duration: transitions.smooth.duration / 1000, ease: easing.easeOut }}
      whileHover={{ y: -8, scale: 1.01 }}
      className="tech-card rounded-xl overflow-hidden h-full flex flex-col"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <FallbackImage
          src={imgSrc}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* 工业风格覆盖层 */}
        <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal via-transparent to-transparent opacity-60"></div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.slice(0, 2).map((cat) => (
              <span
                key={cat.name}
                className="inline-block py-1 px-2 text-xs font-medium rounded-md bg-electric-blue/10 text-electric-blue border border-electric-blue/30 font-mono"
              >
                {cat.label}
              </span>
            ))}
          </div>
        )}

        <h3 className="text-xl font-bold font-heading text-neutral-darker dark:text-white mb-2 group-hover:text-neon-orange transition-colors">
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
                    className={`w-4 h-4 ${filled ? 'text-warning' : 'text-neutral-300 dark:text-metallic/30'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.175 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.88 8.72c-.783-.57-.38-1.81.588-1.81H6.93a1 1 0 00.95-.69l1.07-3.292z" />
                  </svg>
                );
              })}
            </div>
            <span className="text-xs text-neutral-medium dark:text-metallic font-mono">
              {score.toFixed(1)}/5
            </span>
          </div>
        )}

        <p className="text-neutral-dark dark:text-metallic mb-4 flex-grow text-sm line-clamp-3">
          {excerpt}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-200 dark:border-metallic/10">
          <span className="text-xs text-neutral-medium dark:text-metallic font-mono">
            {formattedDate}
          </span>

          <Link
            href={linkHref}
            className="inline-block text-neon-orange font-medium hover:text-electric-blue text-sm font-mono flex items-center gap-2 group/link"
          >
            {locale === 'zh' ? '阅读更多' : 'Read More'}
            <svg
              className="w-4 h-4 transition-transform duration-200 group-hover/link:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default BlogCard; 