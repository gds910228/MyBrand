"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

interface CollapsibleTagCloudProps {
  tags: string[];
  tagCounts: Record<string, number>;
  activeTag?: string;
  locale: 'en' | 'zh';
  defaultVisibleCount?: number;
  baseUrl: string;
}

export default function CollapsibleTagCloud({
  tags,
  tagCounts,
  activeTag,
  locale,
  defaultVisibleCount = 10,
  baseUrl,
}: CollapsibleTagCloudProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 按文章数量排序标签（降序）
  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0));
  }, [tags, tagCounts]);

  // 始终显示激活的标签
  const alwaysShowTags = useMemo(() => {
    if (!activeTag) return [];
    return sortedTags.filter(tag => tag === activeTag);
  }, [sortedTags, activeTag]);

  // 默认显示的标签（前N个 + 激活的标签，去重）
  const defaultVisibleTags = useMemo(() => {
    const baseTags = sortedTags.slice(0, defaultVisibleCount);
    const combined = [...alwaysShowTags, ...baseTags];
    return Array.from(new Set(combined));
  }, [sortedTags, defaultVisibleCount, alwaysShowTags]);

  // 当前应该显示的标签
  const visibleTags = isExpanded ? sortedTags : defaultVisibleTags;

  // 是否应该显示展开/收起按钮
  const showToggleButton = sortedTags.length > defaultVisibleCount || alwaysShowTags.length > 0;

  // 计算剩余标签数量（用于显示"更多"按钮）
  const remainingTagsCount = useMemo(() => {
    return sortedTags.length - defaultVisibleCount;
  }, [sortedTags.length, defaultVisibleCount]);

  // 本地化文本
  const i18n = {
    en: {
      tagsLabel: 'Tags:',
      showMore: `+${remainingTagsCount} more`,
      showLess: 'Show less',
    },
    zh: {
      tagsLabel: '标签:',
      showMore: `+${remainingTagsCount} 更多`,
      showLess: '收起',
    },
  }[locale];

  return (
    <div className="space-y-3">
      {/* 标签云 */}
      <div className="flex flex-wrap gap-2 justify-center items-center">
        <span className="text-xs text-neutral-medium dark:text-dark-neutral-medium mr-2 font-medium">
          {i18n.tagsLabel}
        </span>
        {visibleTags.map((tag) => {
          const count = tagCounts[tag] || 0;
          const isActive = activeTag === tag;
          const opacityClass = count >= 5 ? 'opacity-100' : count >= 2 ? 'opacity-80' : 'opacity-60';

          return (
            <Link
              key={tag}
              href={isActive ? baseUrl : `${baseUrl}?tag=${encodeURIComponent(tag)}`}
              className={`px-3 py-1 rounded-full text-xs font-medium glass-surface border border-white/20 dark:border-white/10 neon-hover transition-all duration-200 ${
                isActive
                  ? 'bg-primary/20 text-primary border-primary/50 scale-105 shadow-lg shadow-primary/20'
                  : 'text-neutral-dark dark:text-dark-neutral-dark hover:scale-105'
              } ${opacityClass}`}
              onClick={() => {
                // 如果点击的是激活的标签，不改变展开状态
                // 如果点击其他标签，可以选择是否自动展开
              }}
            >
              #{tag}
              {count > 1 && (
                <span className="ml-1 text-xs opacity-60">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* 展开/收起按钮 */}
      {showToggleButton && sortedTags.length > defaultVisibleCount && (
        <div className="flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-1.5 rounded-full text-xs font-medium glass-surface border border-white/20 dark:border-white/10 neon-hover transition-all duration-200 text-neutral-dark dark:text-dark-neutral-dark hover:scale-105"
          >
            {isExpanded ? i18n.showLess : i18n.showMore}
          </button>
        </div>
      )}
    </div>
  );
}
