'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFileAlt, faFolder, faClock, faTags } from '@fortawesome/free-solid-svg-icons';
import Section from '@/components/Section';
import Container from '@/components/Container';
import { useSearch } from '@/hooks/useSearch';
import { highlight, searchTexts, popularSearches, type SearchHit } from '@/lib/searchIndex';
import type { Locale } from '@/i18n/locales';

interface SearchPageClientProps {
  locale: Locale;
  initialQuery: string;
  /** 服务端预渲染的结果（无 JS / 首屏兜底，命中 ?q= 时已填充）。 */
  initialHits: SearchHit[];
}

/**
 * 搜索页交互层。
 * - JS 可用：用 useSearch（客户端 MiniSearch 索引）做即时搜索，URL ?q= 同步、可分享刷新。
 * - JS 不可用：表单 method=get 提交回服务端，服务端渲染 initialHits（见 page.tsx）。
 */
export default function SearchPageClient({ locale, initialQuery, initialHits }: SearchPageClientProps) {
  const router = useRouter();
  const t = searchTexts[locale];
  const basePath = locale === 'zh' ? '/zh/search' : '/search';
  const linkPrefix = locale === 'zh' ? '/zh' : '';

  const { query, setQuery, results, total, status, indexReady } = useSearch(locale, {
    enabled: true,
    debounceMs: 200,
    initialQuery,
  });

  // 索引就绪后用客户端结果；之前用服务端兜底结果，避免空闪。
  const hits: SearchHit[] = indexReady && query.trim() ? results.flat : initialHits;
  const showResults = !!query.trim();
  const isSearching = status === 'searching' || status === 'loading-index';

  // URL ?q= 同步（仅在索引就绪、查询变化时；用 replace 不污染历史）。
  const lastSynced = useRef(initialQuery);
  useEffect(() => {
    if (!indexReady) return;
    const q = query.trim();
    if (q === lastSynced.current) return;
    lastSynced.current = q;
    router.replace(q ? `${basePath}?q=${encodeURIComponent(q)}` : basePath, { scroll: false });
  }, [query, indexReady, basePath, router]);

  return (
    <>
      <title>{`${t.pageTitle} - MisoTech`}</title>

      <Section bgColor="bg-neutral-light dark:bg-dark-bg-secondary" className="py-20">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <FontAwesomeIcon icon={faSearch} className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h1 className="text-3xl md:text-4xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
                {t.pageTitle}
              </h1>
              <p className="text-neutral-dark dark:text-dark-neutral-dark">{t.pageSubtitle}</p>
            </div>

            {/* 表单：method=get 提供无 JS 兜底；JS 可用时拦截避免整页刷新。 */}
            <form
              method="get"
              action={basePath}
              onSubmit={(e) => e.preventDefault()}
              className="mb-8"
            >
              <div className="relative">
                <input
                  type="text"
                  name="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.inputPlaceholder}
                  aria-label={t.trigger}
                  className="w-full px-6 py-4 pr-12 rounded-xl glass-surface border border-white/20 dark:border-white/10 bg-white/50 dark:bg-dark-white/10 text-neutral-darker dark:text-dark-neutral-darker placeholder-neutral-dark/50 dark:placeholder-dark-neutral-dark/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-primary hover:bg-primary-light/10 rounded-lg transition-colors"
                  aria-label={t.trigger}
                >
                  <FontAwesomeIcon icon={faSearch} className="w-5 h-5" />
                </button>
              </div>
            </form>

            {!showResults && (
              <div className="text-center">
                <p className="text-sm text-neutral-dark dark:text-dark-neutral-dark mb-4">
                  {t.popular}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {popularSearches[locale].map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
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

      <Section className="py-16">
        <Container>
          {isSearching && hits.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-neutral-dark dark:text-dark-neutral-dark">{t.searching}</p>
            </div>
          ) : showResults && hits.length > 0 ? (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-neutral-darker dark:text-dark-neutral-darker mb-2">
                  {t.pageTitle}
                </h2>
                <p className="text-neutral-dark dark:text-dark-neutral-dark">
                  {t.resultsFor(hits.length, query.trim())}
                </p>
              </div>

              <div className="space-y-6">
                {hits.map((result) => (
                  <div
                    key={`${result.type}-${result.refId}`}
                    className="p-6 rounded-xl glass-surface border border-white/20 dark:border-white/10 hover:scale-[1.01] transition-transform"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <FontAwesomeIcon
                          icon={result.type === 'blog' ? faFileAlt : faFolder}
                          className="w-5 h-5 text-primary mt-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2 gap-3">
                          <Link
                            href={`${linkPrefix}/${result.type === 'blog' ? 'blog' : 'projects'}/${result.slug}`}
                            className="text-xl font-semibold text-neutral-darker dark:text-dark-neutral-darker hover:text-primary dark:hover:text-dark-primary transition-colors [&_mark]:bg-primary-light/50 [&_mark]:dark:bg-dark-primary/40 [&_mark]:text-inherit [&_mark]:rounded-sm"
                            dangerouslySetInnerHTML={{ __html: highlight(result.title, query) }}
                          />
                          <span className="px-2 py-1 text-xs rounded-full bg-primary-light/20 text-primary dark:bg-dark-primary-light/20 dark:text-dark-primary whitespace-nowrap">
                            {result.type === 'blog' ? t.groupBlog : t.groupProject}
                          </span>
                        </div>

                        {result.excerpt && (
                          <p
                            className="text-neutral-dark dark:text-dark-neutral-dark mb-4 line-clamp-2 [&_mark]:bg-primary-light/40 [&_mark]:dark:bg-dark-primary/30 [&_mark]:text-inherit [&_mark]:rounded-sm"
                            dangerouslySetInnerHTML={{ __html: highlight(result.excerpt, query) }}
                          />
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-dark/60 dark:text-dark-neutral-dark/60">
                          {result.date && (
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                              <span>
                                {new Date(result.date).toLocaleDateString(
                                  locale === 'zh' ? 'zh-CN' : undefined,
                                )}
                              </span>
                            </div>
                          )}
                          {result.keywords && result.keywords.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <FontAwesomeIcon icon={faTags} className="w-3 h-3" />
                              <span>{result.keywords.slice(0, 3).join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : showResults && !isSearching ? (
            <div className="text-center py-16">
              <FontAwesomeIcon
                icon={faSearch}
                className="w-16 h-16 text-neutral-dark/30 dark:text-dark-neutral-dark/30 mb-4 mx-auto"
              />
              <h3 className="text-xl font-semibold text-neutral-darker dark:text-dark-neutral-darker mb-2">
                {t.noResults}
              </h3>
              <p className="text-neutral-dark dark:text-dark-neutral-dark mb-8">{t.noResultsHint}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`${linkPrefix}/blog`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4" />
                  {t.browseBlog}
                </Link>
                <Link
                  href={`${linkPrefix}/projects`}
                  className="inline-flex items-center gap-2 px-6 py-3 glass-surface border border-white/20 dark:border-white/10 rounded-lg hover:scale-105 transition-transform"
                >
                  <FontAwesomeIcon icon={faFolder} className="w-4 h-4" />
                  {t.browseProjects}
                </Link>
              </div>
            </div>
          ) : null}
        </Container>
      </Section>
    </>
  );
}
