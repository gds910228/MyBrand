"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFileAlt, faFolder, faClock, faTags, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Section from '@/components/Section';
import Container from '@/components/Container';

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  type: 'blog' | 'project';
  date: string;
  tags?: string[];
  readTime?: string;
  technologies?: string[];
  score?: number; // Relevance score from search
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (!query.trim()) {
            setSearchResults([]);
            return;
          }

          setIsLoading(true);
          try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&language=Chinese`);
            if (!response.ok) {
              throw new Error(`搜索失败: ${response.statusText}`);
            }
            const data = await response.json();
            setSearchResults(data.results || []);
          } catch (error) {
            console.error('[SearchPage] 搜索错误:', error);
            setSearchResults([]);
          } finally {
            setIsLoading(false);
          }
        }, 300); // 300ms debounce
      };
    }, []),
    []
  );

  // Handle search query change with debouncing
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Immediate search on form submit
      debouncedSearch(searchQuery);
    }
  };

  const popularSearches = ['Next.js', 'TypeScript', 'React', 'Web开发', '前端', 'AI', '人工智能', 'Notion'];

  return (
    <>
      <title>搜索 - MisoTech</title>

      <Section bgColor="bg-neutral-light dark:bg-dark-bg-secondary" className="py-20">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <FontAwesomeIcon
                icon={faSearch}
                className="w-12 h-12 text-primary mb-4 mx-auto"
              />
              <h1 className="text-3xl md:text-4xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
                搜索内容
              </h1>
              <p className="text-neutral-dark dark:text-dark-neutral-dark">
                搜索博客文章、项目和相关技术内容
              </p>
            </div>

            {/* 搜索表单 */}
            <form onSubmit={handleSubmit} className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入关键词搜索..."
                  className="w-full px-6 py-4 pr-12 rounded-xl glass-surface border border-white/20 dark:border-white/10 bg-white/50 dark:bg-dark-white/10 text-neutral-darker dark:text-dark-neutral-darker placeholder-neutral-dark/50 dark:placeholder-dark-neutral-dark/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-primary hover:bg-primary-light/10 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faSearch} className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* 热门搜索 */}
            {!searchQuery && (
              <div className="text-center">
                <p className="text-sm text-neutral-dark dark:text-dark-neutral-dark mb-4">
                  热门搜索：
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="px-3 py-1 text-sm rounded-full glass-surface border border-white/20 dark:border-white/10 hover:scale-105 transition-transform"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* 搜索结果 */}
      <Section className="py-16">
        <Container>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-neutral-dark dark:text-dark-neutral-dark">
                搜索中...
              </p>
            </div>
          ) : searchQuery && searchResults.length > 0 ? (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-neutral-darker dark:text-dark-neutral-darker mb-2">
                  搜索结果
                </h2>
                <p className="text-neutral-dark dark:text-dark-neutral-dark">
                  找到 {searchResults.length} 个与 "{searchQuery}" 相关的结果
                </p>
              </div>

              <div className="space-y-6">
                {searchResults.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="p-6 rounded-xl glass-surface border border-white/20 dark:border-white/10 hover:scale-[1.01] transition-transform"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <FontAwesomeIcon
                          icon={result.type === 'blog' ? faFileAlt : faFolder}
                          className="w-5 h-5 text-primary mt-1"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <Link
                            href={result.type === 'blog' ? `/zh/blog/${result.slug}` : `/zh/projects/${result.slug}`}
                            className="text-xl font-semibold text-neutral-darker dark:text-dark-neutral-darker hover:text-primary dark:hover:text-dark-primary transition-colors"
                          >
                            {result.title}
                          </Link>
                          <span className="px-2 py-1 text-xs rounded-full bg-primary-light/20 text-primary dark:bg-dark-primary-light/20 dark:text-dark-primary ml-3">
                            {result.type === 'blog' ? '博客' : '项目'}
                          </span>
                        </div>

                        <p className="text-neutral-dark dark:text-dark-neutral-dark mb-4 line-clamp-2">
                          {result.excerpt}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-dark/60 dark:text-dark-neutral-dark/60">
                          <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                            <span>{new Date(result.date).toLocaleDateString('zh-CN')}</span>
                          </div>

                          {result.type === 'blog' && result.tags && result.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faTags} className="w-3 h-3" />
                              <span>{result.tags.slice(0, 3).join(', ')}</span>
                            </div>
                          )}

                          {result.type === 'project' && result.technologies && result.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {result.technologies.slice(0, 3).map((tech) => (
                                <span key={tech} className="px-1 py-0.5 bg-primary-light/20 text-primary dark:bg-dark-primary-light/20 dark:text-dark-primary rounded">
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
            </div>
          ) : searchQuery && !isLoading ? (
            <div className="text-center py-16">
              <FontAwesomeIcon
                icon={faSearch}
                className="w-16 h-16 text-neutral-dark/30 dark:text-dark-neutral-dark/30 mb-4 mx-auto"
              />
              <h3 className="text-xl font-semibold text-neutral-darker dark:text-dark-neutral-darker mb-2">
                没有找到相关内容
              </h3>
              <p className="text-neutral-dark dark:text-dark-neutral-dark mb-8">
                尝试使用其他关键词或浏览我们的最新内容
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/zh/blog"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4" />
                  浏览博客
                </Link>
                <Link
                  href="/zh/projects"
                  className="inline-flex items-center gap-2 px-6 py-3 glass-surface border border-white/20 dark:border-white/10 rounded-lg hover:scale-105 transition-transform"
                >
                  <FontAwesomeIcon icon={faFolder} className="w-4 h-4" />
                  查看项目
                </Link>
              </div>
            </div>
          ) : null}
        </Container>
      </Section>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <Section bgColor="bg-neutral-light dark:bg-dark-bg-secondary" className="py-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-neutral-dark dark:text-dark-neutral-dark">加载中...</p>
          </div>
        </Container>
      </Section>
    }>
      <SearchContent />
    </Suspense>
  );
}