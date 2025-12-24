"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faFolder, faTags, faClock, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { getAllBlogPosts, getAllProjects } from '@/services/notion';

interface RecommendationItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  type: 'blog' | 'project';
  date: string;
  tags?: string[];
  technologies?: string[];
  readTime?: string;
  score: number;
}

interface SmartRecommendationsProps {
  currentPath?: string;
  fallbackKeywords?: string[];
  maxItems?: number;
  title?: string;
  showType?: 'blog' | 'project' | 'all';
}

export default function SmartRecommendations({
  currentPath,
  fallbackKeywords = [],
  maxItems = 6,
  title = "推荐内容",
  showType = 'all'
}: SmartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateRecommendations = async () => {
      try {
        // 从当前URL或路径提取关键词
        const keywords = extractKeywords(currentPath || '', fallbackKeywords);

        let content: RecommendationItem[] = [];

        if (showType === 'all' || showType === 'blog') {
          const posts = await getAllBlogPosts({ language: 'English' });
          content.push(...posts.map(post => ({
            id: post.id,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            type: 'blog' as const,
            date: post.date,
            tags: post.tags,
            readTime: post.readTime,
            score: 0
          })));
        }

        if (showType === 'all' || showType === 'project') {
          const projects = await getAllProjects();
          content.push(...projects.map(project => ({
            id: project.id,
            slug: project.slug,
            title: project.title,
            excerpt: project.description,
            type: 'project' as const,
            date: (project as any).createdTime || new Date().toISOString(),
            technologies: project.technologies,
            score: 0
          })));
        }

        // 计算推荐分数
        const scoredContent = content.map(item => ({
          ...item,
          score: calculateRelevanceScore(item, keywords)
        }));

        // 排序并取前N个
        const filteredAndSorted = scoredContent
          .filter(item => item.score > 0) // 只显示有相关性的内容
          .sort((a, b) => b.score - a.score)
          .slice(0, maxItems);

        setRecommendations(filteredAndSorted);
      } catch (error) {
        console.error('[SmartRecommendations] Failed to generate recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateRecommendations();
  }, [currentPath, fallbackKeywords, maxItems, showType]);

  // 从路径中提取关键词
  const extractKeywords = (path: string, fallback: string[]): string[] => {
    const keywords: string[] = [];

    // 从路径提取
    const pathParts = path.split('/').filter(part => part.length > 2);
    keywords.push(...pathParts);

    // 添加后备关键词
    keywords.push(...fallback);

    // 常见技术关键词映射
    const techKeywordMap: { [key: string]: string[] } = {
      'blog': ['教程', '开发', '技术', '编程'],
      'projects': ['项目', '作品', '案例'],
      'react': ['React', 'JavaScript', '前端'],
      'nextjs': ['Next.js', 'React', 'Node.js'],
      'typescript': ['TypeScript', 'JavaScript', '类型'],
      'node': ['Node.js', '后端', 'JavaScript'],
      'web': ['Web', 'HTML', 'CSS', 'JavaScript'],
    };

    // 扩展关键词
    const expandedKeywords = [...keywords];
    keywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      if (techKeywordMap[lowerKeyword]) {
        expandedKeywords.push(...techKeywordMap[lowerKeyword]);
      }
    });

    return Array.from(new Set(expandedKeywords)); // 去重
  };

  // 计算内容相关性分数
  const calculateRelevanceScore = (item: RecommendationItem, keywords: string[]): number => {
    let score = 0;
    const lowercaseTitle = item.title.toLowerCase();
    const lowercaseExcerpt = item.excerpt.toLowerCase();

    keywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();

      // 标题匹配（权重最高）
      if (lowercaseTitle.includes(lowerKeyword)) {
        score += 10;
      }

      // 摘要匹配
      if (lowercaseExcerpt.includes(lowerKeyword)) {
        score += 5;
      }

      // 标签匹配
      if (item.tags?.some(tag => tag.toLowerCase().includes(lowerKeyword))) {
        score += 8;
      }

      // 技术栈匹配
      if (item.technologies?.some(tech => tech.toLowerCase().includes(lowerKeyword))) {
        score += 8;
      }
    });

    // 时间衰减因子（较新的内容分数略高）
    const daysSinceCreation = (Date.now() - new Date(item.date).getTime()) / (1000 * 60 * 60 * 24);
    const timeFactor = Math.max(0.5, 1 - daysSinceCreation / 365); // 一年内的内容有加成
    score *= timeFactor;

    return score;
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-neutral-dark dark:text-dark-neutral-dark">
            加载推荐内容...
          </p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="py-8 text-center">
        <FontAwesomeIcon
          icon={faTags}
          className="w-8 h-8 text-neutral-dark/30 dark:text-dark-neutral-dark/30 mb-2"
        />
        <p className="text-sm text-neutral-dark dark:text-dark-neutral-dark">
          暂无相关推荐
        </p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h3 className="text-lg font-semibold text-neutral-darker dark:text-dark-neutral-darker mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faTags} className="w-4 h-4 text-primary" />
        {title}
      </h3>

      <div className="space-y-4">
        {recommendations.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            className="p-4 rounded-lg glass-surface border border-white/20 dark:border-white/10 hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <FontAwesomeIcon
                  icon={item.type === 'blog' ? faFileAlt : faFolder}
                  className="w-4 h-4 text-primary"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <Link
                    href={item.type === 'blog' ? `/blog/${item.slug}` : `/projects/${item.slug}`}
                    className="font-medium text-neutral-darker dark:text-dark-neutral-darker hover:text-primary dark:hover:text-dark-primary transition-colors line-clamp-1"
                  >
                    {item.title}
                  </Link>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.type === 'blog'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {item.type === 'blog' ? '博客' : '项目'}
                    </span>
                    {item.score > 15 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        高相关
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-neutral-dark dark:text-dark-neutral-dark mb-2 line-clamp-2">
                  {item.excerpt}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-dark/60 dark:text-dark-neutral-dark/60">
                  <div className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>

                  {item.type === 'blog' && item.tags && item.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faTags} className="w-3 h-3" />
                      <span>{item.tags.slice(0, 2).join(', ')}</span>
                    </div>
                  )}

                  {item.type === 'project' && item.technologies && item.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.technologies.slice(0, 2).map((tech) => (
                        <span key={tech} className="px-1 py-0.5 bg-primary-light/20 text-primary dark:bg-dark-primary-light/20 dark:text-dark-primary rounded text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <Link
          href={showType === 'blog' ? '/blog' : showType === 'project' ? '/projects' : '/search'}
          className="text-sm text-primary dark:text-dark-primary font-medium hover:underline inline-flex items-center gap-1"
        >
          查看更多
          <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}