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

// 技术栈分类和颜色映射 - 工业未来主义配色
const getTechCategoryColor = (tech: string): string => {
  const frontend = ['React', 'Next.js', 'Vue.js', 'Angular', 'TypeScript', 'Tailwind CSS', 'HTML', 'CSS'];
  const backend = ['Node.js', 'Express', 'Python', 'Django', 'Java', 'Spring', 'MongoDB', 'PostgreSQL', 'MySQL'];
  const mobile = ['Flutter', 'React Native', 'Swift', 'Kotlin', 'Firebase'];
  const tools = ['Git', 'Docker', 'AWS', 'Figma', 'Jest'];
  const design = ['Figma', 'Adobe XD', 'Prototyping', 'User Research'];

  if (frontend.some(t => tech.includes(t))) return 'bg-electric-blue/10 text-electric-blue border border-electric-blue/30 hover:bg-electric-blue/20';
  if (backend.some(t => tech.includes(t))) return 'bg-acid-green/10 text-acid-green border border-acid-green/30 hover:bg-acid-green/20';
  if (mobile.some(t => tech.includes(t))) return 'bg-neon-orange/10 text-neon-orange border border-neon-orange/30 hover:bg-neon-orange/20';
  if (tools.some(t => tech.includes(t))) return 'bg-metallic/10 text-metallic border border-metallic/30 hover:bg-metallic/20';
  if (design.some(t => tech.includes(t))) return 'bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20';

  return 'bg-metallic/5 text-metallic border border-metallic/20 hover:bg-metallic/10';
};

// 状态徽章颜色 - 工业未来主义配色
const getStatusBadgeStyle = (status: string) => {
  const statusMap: Record<string, string> = {
    'Published': 'bg-acid-green/10 text-acid-green border border-acid-green/30',
    'In Progress': 'bg-neon-orange/10 text-neon-orange border border-neon-orange/30',
    'Draft': 'bg-metallic/10 text-metallic border border-metallic/30',
    'Archived': 'bg-metallic/5 text-metallic/60 border border-metallic/20',
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
      whileHover={{ y: -12, scale: 1.02 }}
      className={`group tech-card rounded-xl overflow-hidden ${className}`}
    >
      {/* 项目封面 */}
      <div className="relative h-48 sm:h-56 w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt || title}
          fill
          className={`object-cover transition-transform duration-700 group-hover:scale-110 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoad={() => setIsImageLoaded(true)}
        />

        {/* 工业风格覆盖层 */}
        <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

        {/* 状态徽章 */}
        {status && (
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold ${getStatusBadgeStyle(status)}`}>
              {locale === 'zh' ? (status === 'Published' ? '已发布' : status === 'In Progress' ? '进行中' : status) : status}
            </span>
          </div>
        )}

        {/* GitHub 星标数 */}
        {githubUrl && stars !== undefined && stars > 0 && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-deep-charcoal/90 backdrop-blur-sm rounded-md text-xs font-mono font-semibold text-warning border border-warning/30">
              <FontAwesomeIcon icon={faStar} className="w-3 h-3" />
              {stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* 标题和元数据 */}
        <div className="mb-3">
          <h3 className="text-xl font-bold font-heading text-neutral-darker dark:text-white mb-2 group-hover:text-neon-orange transition-colors line-clamp-2">
            {title}
          </h3>

          {/* 项目元信息 */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-medium dark:text-metallic mb-3 font-mono">
            {year && (
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faCalendar} className="w-3 h-3 text-electric-blue" />
                {year}
              </span>
            )}
            {role && (
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faUsers} className="w-3 h-3 text-acid-green" />
                {role}
              </span>
            )}
            {client && <span className="truncate max-w-[150px]">{client}</span>}
          </div>
        </div>

        {/* 描述 */}
        <p className="text-neutral-dark dark:text-metallic mb-4 text-sm line-clamp-3 min-h-[60px]">
          {truncatedDescription}
        </p>

        {/* 技术栈标签 */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className={`inline-block py-1 px-2.5 text-xs font-medium rounded-md border transition-all duration-200 hover:scale-105 ${getTechCategoryColor(tag)}`}
              >
                {tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="inline-block py-1 px-2.5 text-xs font-medium rounded-md bg-metallic/5 text-metallic border border-metallic/20">
                +{tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-metallic/10">
          {/* GitHub 链接 */}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on GitHub"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-metallic/5 hover:bg-neutral-200 dark:hover:bg-metallic/10 text-neutral-darker dark:text-white transition-all duration-200 hover:scale-105 border border-neutral-200 dark:border-metallic/20 hover:border-neutral-300 dark:hover:border-metallic/30"
              title={locale === 'zh' ? '在 GitHub 上查看' : 'View on GitHub'}
            >
              <FontAwesomeIcon icon={faGithub} className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">GitHub</span>
            </a>
          )}

          {/* 查看详情链接 */}
          <Link
            href={linkHref}
            className="flex items-center gap-2 text-neon-orange font-medium hover:text-electric-blue text-sm group/link font-mono relative z-10"
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
