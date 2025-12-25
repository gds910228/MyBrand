"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faExternalLinkAlt, faCalendar, faUsers, faStar } from '@fortawesome/free-solid-svg-icons';
import { transitions, easing } from '@/styles/animations';

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
  year?: string;
  status?: string;
  stars?: number;
}

// 技术栈分类和颜色映射
const getTechCategoryColor = (tech: string): string => {
  const frontend = ['React', 'Next.js', 'Vue.js', 'Angular', 'TypeScript', 'Tailwind CSS', 'HTML', 'CSS'];
  const backend = ['Node.js', 'Express', 'Python', 'Django', 'Java', 'Spring', 'MongoDB', 'PostgreSQL', 'MySQL'];
  const mobile = ['Flutter', 'React Native', 'Swift', 'Kotlin', 'Firebase'];
  const tools = ['Git', 'Docker', 'AWS', 'Figma', 'Jest'];
  const design = ['Figma', 'Adobe XD', 'Prototyping', 'User Research'];

  if (frontend.some(t => tech.includes(t))) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  if (backend.some(t => tech.includes(t))) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
  if (mobile.some(t => tech.includes(t))) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  if (tools.some(t => tech.includes(t))) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
  if (design.some(t => tech.includes(t))) return 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800';

  return 'bg-neutral-light dark:bg-dark-neutral-light text-neutral-dark dark:text-dark-neutral-dark border-neutral-300 dark:border-dark-neutral-dark';
};

// 状态徽章颜色
const getStatusBadgeStyle = (status: string) => {
  const statusMap: Record<string, string> = {
    'Published': 'bg-green-light/30 dark:bg-dark-green-light/30 text-green-dark dark:text-dark-green-dark border border-green dark:border-dark-green',
    'In Progress': 'bg-yellow-light/30 dark:bg-dark-yellow-light/30 text-yellow-dark dark:text-dark-yellow-dark border border-yellow dark:border-dark-yellow',
    'Draft': 'bg-neutral-light/50 dark:bg-dark-neutral-light/50 text-neutral-medium dark:text-dark-neutral-medium border border-neutral dark:border-dark-neutral',
    'Archived': 'bg-gray-light/30 dark:bg-dark-gray-light/30 text-gray-dark dark:text-dark-gray-dark border border-gray dark:border-dark-gray',
  };

  return statusMap[status] || statusMap['Draft'];
};

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
  year,
  status,
  stars,
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const linkHref = locale === 'zh' ? `/zh/projects/${slug}` : `/projects/${slug}`;

  // 描述文本截断
  const truncatedDescription = description.length > 100
    ? description.slice(0, 100) + '...'
    : description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: transitions.smooth.duration / 1000, ease: easing.easeOut }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`group bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg hover:shadow-2xl dark:hover:shadow-neutral-black/30 transition-all duration-300 overflow-hidden border border-neutral-light/50 dark:border-dark-neutral-light/50 ${className}`}
    >
      {/* 项目封面 */}
      <div className="relative h-48 sm:h-56 w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt || title}
          fill
          className={`object-cover transition-transform duration-500 group-hover:scale-110 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoad={() => setIsImageLoaded(true)}
        />

        {/* 状态徽章 */}
        {status && (
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(status)}`}>
              {locale === 'zh' ? (status === 'Published' ? '已发布' : status === 'In Progress' ? '进行中' : status) : status}
            </span>
          </div>
        )}

        {/* GitHub 星标数 */}
        {githubUrl && stars !== undefined && stars > 0 && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
              <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-yellow-400" />
              {stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* 标题和元数据 */}
        <div className="mb-3">
          <h3 className="text-xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-2 group-hover:text-primary dark:group-hover:text-dark-primary transition-colors line-clamp-2">
            {title}
          </h3>

          {/* 项目元信息 */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-medium dark:text-dark-neutral-medium mb-3">
            {year && (
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faCalendar} className="w-3 h-3" />
                {year}
              </span>
            )}
            {role && (
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faUsers} className="w-3 h-3" />
                {role}
              </span>
            )}
            {client && <span className="truncate max-w-[150px]">{client}</span>}
          </div>
        </div>

        {/* 描述 */}
        <p className="text-neutral-dark dark:text-dark-neutral-dark mb-4 text-sm line-clamp-3 min-h-[60px]">
          {truncatedDescription}
        </p>

        {/* 技术栈标签 */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className={`inline-block py-1 px-2.5 text-xs font-medium rounded-md border transition-colors duration-200 hover:scale-105 ${getTechCategoryColor(tag)}`}
              >
                {tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="inline-block py-1 px-2.5 text-xs font-medium rounded-md bg-neutral-light dark:bg-dark-neutral-light text-neutral-dark dark:text-dark-neutral-dark border border-neutral-300 dark:border-dark-neutral-dark">
                +{tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-light dark:border-dark-neutral-light">
          {/* GitHub 链接 */}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on GitHub"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-light dark:bg-dark-neutral-light hover:bg-neutral-300 dark:hover:bg-dark-neutral-dark text-neutral-darker dark:text-dark-neutral-darker transition-all duration-200 hover:scale-105"
              title={locale === 'zh' ? '在 GitHub 上查看' : 'View on GitHub'}
            >
              <FontAwesomeIcon icon={faGithub} className="w-5 h-5" />
              <span className="text-xs font-medium hidden sm:inline">GitHub</span>
            </a>
          )}

          {/* 查看详情链接 */}
          <Link
            href={linkHref}
            className="flex items-center gap-2 text-primary dark:text-dark-primary font-medium hover:underline text-sm group/link"
          >
            {locale === 'zh' ? '查看详情' : 'View Details'}
            <FontAwesomeIcon
              icon={faExternalLinkAlt}
              className="w-3 h-3 transition-transform duration-200 group-hover/link:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
