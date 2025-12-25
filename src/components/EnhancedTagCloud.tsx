"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

interface TagGroup {
  name: string;
  nameZh: string;
  tags?: string[];
  icon?: string;
}

interface EnhancedTagCloudProps {
  tags: string[];
  tagCounts: Record<string, number>;
  activeTag?: string;
  locale: 'en' | 'zh';
  baseUrl: string;
  groups?: TagGroup[];
  defaultVisibleCount?: number;
  enableSearch?: boolean;
  enableGrouping?: boolean;
}

// 默认标签分组配置
const defaultGroups: TagGroup[] = [
  {
    name: 'Frontend',
    nameZh: '前端开发',
    icon: '⚛️',
  },
  {
    name: 'Backend',
    nameZh: '后端开发',
    icon: '🔧',
  },
  {
    name: 'DevOps',
    nameZh: '运维工具',
    icon: '🚀',
  },
  {
    name: 'Database',
    nameZh: '数据库',
    icon: '🗄️',
  },
  {
    name: 'Design',
    nameZh: '设计',
    icon: '🎨',
  },
  {
    name: 'Other',
    nameZh: '其他',
    icon: '📦',
  },
];

// 自动将标签分类到分组
function autoGroupTags(tags: string[], groups: TagGroup[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  const ungrouped: string[] = [];

  // 初始化分组
  groups.forEach(group => {
    grouped[group.name] = [];
  });

  // 前端相关关键词
  const frontendKeywords = ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'javascript', 'typescript', 'css', 'html', 'tailwind', 'scss', 'webpack', 'vite', 'frontend', 'ui', 'ux'];

  // 后端相关关键词
  const backendKeywords = ['node', 'express', 'nest', 'python', 'django', 'flask', 'java', 'spring', 'go', 'golang', 'ruby', 'rails', 'php', 'laravel', 'backend', 'api', 'rest', 'graphql'];

  // DevOps相关关键词
  const devopsKeywords = ['docker', 'kubernetes', 'k8s', 'git', 'ci', 'cd', 'aws', 'azure', 'gcp', 'vercel', 'netlify', 'devops', 'deploy', 'jenkins', 'github'];

  // 数据库相关关键词
  const databaseKeywords = ['mysql', 'postgresql', 'mongo', 'redis', 'sqlite', 'database', 'db', 'prisma', 'sequelize', 'mongoose'];

  // 设计相关关键词
  const designKeywords = ['figma', 'sketch', 'design', 'ui', 'ux', 'photoshop', 'illustrator'];

  tags.forEach(tag => {
    const lowerTag = tag.toLowerCase();
    let assigned = false;

    // 检查每个分组
    if (frontendKeywords.some(keyword => lowerTag.includes(keyword))) {
      grouped['Frontend'].push(tag);
      assigned = true;
    } else if (backendKeywords.some(keyword => lowerTag.includes(keyword))) {
      grouped['Backend'].push(tag);
      assigned = true;
    } else if (devopsKeywords.some(keyword => lowerTag.includes(keyword))) {
      grouped['DevOps'].push(tag);
      assigned = true;
    } else if (databaseKeywords.some(keyword => lowerTag.includes(keyword))) {
      grouped['Database'].push(tag);
      assigned = true;
    } else if (designKeywords.some(keyword => lowerTag.includes(keyword))) {
      grouped['Design'].push(tag);
      assigned = true;
    }

    if (!assigned) {
      ungrouped.push(tag);
    }
  });

  // 将未分类的标签放入Other分组
  grouped['Other'] = ungrouped;

  return grouped;
}

export default function EnhancedTagCloud({
  tags,
  tagCounts,
  activeTag,
  locale,
  baseUrl,
  groups = defaultGroups,
  defaultVisibleCount = 10,
  enableSearch = true,
  enableGrouping = false,
}: EnhancedTagCloudProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // 按文章数量排序标签（降序）
  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0));
  }, [tags, tagCounts]);

  // 过滤标签（搜索功能）
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return sortedTags;
    const query = searchQuery.toLowerCase();
    return sortedTags.filter(tag => tag.toLowerCase().includes(query));
  }, [sortedTags, searchQuery]);

  // 标签分组
  const groupedTags = useMemo(() => {
    if (!enableGrouping) return null;
    return autoGroupTags(filteredTags, groups);
  }, [filteredTags, groups, enableGrouping]);

  // 始终显示激活的标签
  const alwaysShowTags = useMemo(() => {
    if (!activeTag) return [];
    return sortedTags.filter(tag => tag === activeTag);
  }, [sortedTags, activeTag]);

  // 默认显示的标签（非分组模式）
  const defaultVisibleTags = useMemo(() => {
    if (enableGrouping) return filteredTags;
    const baseTags = filteredTags.slice(0, defaultVisibleCount);
    const combined = [...alwaysShowTags, ...baseTags];
    return Array.from(new Set(combined));
  }, [filteredTags, defaultVisibleCount, alwaysShowTags, enableGrouping]);

  // 当前应该显示的标签
  const visibleTags = isExpanded || enableGrouping ? filteredTags : defaultVisibleTags;

  // 是否应该显示展开/收起按钮
  const showToggleButton = !enableGrouping && (sortedTags.length > defaultVisibleCount || alwaysShowTags.length > 0);

  // 计算剩余标签数量
  const remainingTagsCount = useMemo(() => {
    return sortedTags.length - defaultVisibleCount;
  }, [sortedTags.length, defaultVisibleCount]);

  // 本地化文本
  const i18n = {
    en: {
      tagsLabel: 'Tags:',
      searchPlaceholder: 'Search tags...',
      showMore: `+${remainingTagsCount} more`,
      showLess: 'Show less',
      noResults: 'No tags found',
      clearSearch: 'Clear',
    },
    zh: {
      tagsLabel: '标签:',
      searchPlaceholder: '搜索标签...',
      showMore: `+${remainingTagsCount} 更多`,
      showLess: '收起',
      noResults: '未找到标签',
      clearSearch: '清除',
    },
  }[locale];

  // 切换分组折叠状态
  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // 渲染单个标签
  const renderTag = (tag: string) => {
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
      >
        #{tag}
        {count > 1 && (
          <span className="ml-1 text-xs opacity-60">
            {count}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      {enableSearch && (
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={i18n.searchPlaceholder}
            className="w-full px-4 py-2 pl-10 rounded-full text-sm glass-surface border border-white/20 dark:border-white/10 text-neutral-dark dark:text-dark-neutral-dark placeholder:text-neutral-medium dark:placeholder:text-dark-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-medium"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-medium hover:text-neutral-dark dark:hover:text-dark-neutral-dark transition-colors"
            >
              {i18n.clearSearch}
            </button>
          )}
        </div>
      )}

      {/* 分组模式 */}
      {enableGrouping && groupedTags ? (
        <div className="space-y-4">
          {groups.map((group) => {
            const groupTags = groupedTags[group.name] || [];
            const isCollapsed = collapsedGroups[group.name];
            const shouldShow = groupTags.length > 0;

            if (!shouldShow) return null;

            return (
              <div key={group.name} className="space-y-2">
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="flex items-center gap-2 text-xs font-medium text-neutral-dark dark:text-dark-neutral-dark hover:text-primary dark:hover:text-dark-primary transition-colors"
                >
                  <span className="text-sm">{group.icon}</span>
                  <span>{locale === 'zh' ? group.nameZh : group.name}</span>
                  <span className="text-neutral-medium">({groupTags.length})</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {!isCollapsed && (
                  <div className="flex flex-wrap gap-2 justify-start pl-6">
                    {groupTags.map(renderTag)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* 非分组模式 */
        <>
          {/* 标签云 */}
          <div className="flex flex-wrap gap-2 justify-center items-center">
            <span className="text-xs text-neutral-medium dark:text-dark-neutral-medium mr-2 font-medium">
              {i18n.tagsLabel}
            </span>
            {visibleTags.length > 0 ? (
              visibleTags.map(renderTag)
            ) : (
              <span className="text-xs text-neutral-medium">{i18n.noResults}</span>
            )}
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
        </>
      )}
    </div>
  );
}
