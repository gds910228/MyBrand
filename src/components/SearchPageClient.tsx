'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFileAlt,
  faFolder,
  faClock,
  faTags,
  faFilter,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import Section from '@/components/Section';
import Container from '@/components/Container';
import { highlight, searchTexts, popularSearches } from '@/lib/searchIndex';
import { useSuggestions } from '@/hooks/useSearch';
import type { Locale } from '@/i18n/locales';
import type { ParsedSearchQuery, SearchResultItem, SearchSuggestion } from '@/types/search';

/** 服务端预渲染的结果数据（分页后的当前页 + 元信息）。 */
export interface SearchPageData {
  items: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  tookMs: number;
}

interface SearchPageClientProps {
  locale: Locale;
  params: ParsedSearchQuery;
  data: SearchPageData;
  /** 当前索引中存在的全部标签（供筛选下拉与「清除筛选」判断）。 */
  tags: string[];
  /** 服务端参数解析失败的提示（非法 type/sort/date 等）。 */
  paramError?: string;
}

/**
 * 搜索页交互层（feat-search-discovery-20260928，能力块 G）。
 *
 * **URL 即状态**：q / type / tag / sort / from / to / page 全部由 URL query 驱动，
 * 结果由服务端按 URL 检索并 SSR 直出（见 `app/search/page.tsx`）。
 * - 筛选变更 → `router.push`（**写历史**），使浏览器回退能逐步回退筛选状态；
 * - 输入框打字 → 防抖后 `router.replace`（不写历史），避免每敲一个字符留一条历史；
 * - 无 JS 时表单 `method="get"` 直接提交回服务端，SSR 依旧给出正确结果。
 */
export default function SearchPageClient({
  locale,
  params,
  data,
  tags,
  paramError,
}: SearchPageClientProps) {
  const router = useRouter();
  const t = searchTexts[locale];
  const basePath = locale === 'zh' ? '/zh/search' : '/search';
  const linkPrefix = locale === 'zh' ? '/zh' : '';

  const [query, setQuery] = useState(params.q);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dateFrom, setDateFrom] = useState(params.from || '');
  const [dateTo, setDateTo] = useState(params.to || '');
  const lastPushed = useRef(params.q);

  const { suggestions } = useSuggestions(locale, query, { enabled: showSuggestions });

  // 服务端导航后同步输入框（例如浏览器回退改变了 q）。
  // 评审 P2-1：若用户仍在打字（本地 query 尚未提交），此时服务端回包到达，
  // 直接用 params.q 覆盖会把用户刚敲的字符吞掉。故仅在「本地无待提交编辑」时同步。
  useEffect(() => {
    setQuery((current) => (current === lastPushed.current ? params.q : current));
    setDateFrom(params.from || '');
    setDateTo(params.to || '');
    lastPushed.current = params.q;
  }, [params.q, params.from, params.to]);

  /** 构造新的 URL（保留未变更的维度，变更维度重置 page=1）。 */
  const buildUrl = (overrides: Partial<Record<string, string | null>>, resetPage = true): string => {
    const sp = new URLSearchParams();
    const next: Record<string, string | null | undefined> = {
      q: params.q || null,
      type: params.type,
      tag: params.tag,
      sort: params.sort === 'relevance' ? null : params.sort,
      from: params.from,
      to: params.to,
      page: params.page > 1 ? String(params.page) : null,
      ...overrides,
    };
    for (const [k, v] of Object.entries(next)) {
      if (v !== null && v !== undefined && v !== '') sp.set(k, String(v));
    }
    if (resetPage) sp.delete('page');
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // 输入框打字：防抖 + replace（不污染历史）
  useEffect(() => {
    if (query === lastPushed.current) return;
    const timer = setTimeout(() => {
      lastPushed.current = query;
      router.replace(buildUrl({ q: query.trim() || null }), { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const applyFilter = (overrides: Partial<Record<string, string | null>>) => {
    setShowSuggestions(false);
    router.push(buildUrl(overrides));
  };

  const hasFilters = !!(params.type || params.tag || params.from || params.to || params.sort === 'newest');
  const showResults = !!params.q;

  const rangeText = useMemo(() => {
    if (data.total === 0) return '';
    const from = (data.page - 1) * data.pageSize + 1;
    const to = Math.min(data.page * data.pageSize, data.total);
    return t.showingRange(from, to, data.total);
  }, [data, t]);

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

            {/* 表单：method=get 提供无 JS 兜底；JS 可用时拦截避免整页刷新。
                隐藏域把当前筛选维度一并带回服务端，保证无 JS 下结果依然正确。 */}
            <form
              method="get"
              action={basePath}
              onSubmit={(e) => {
                e.preventDefault();
                setShowSuggestions(false);
                router.push(buildUrl({ q: query.trim() || null, from: dateFrom || null, to: dateTo || null }));
              }}
              className="mb-6"
            >
              {params.type && <input type="hidden" name="type" value={params.type} />}
              {params.tag && <input type="hidden" name="tag" value={params.tag} />}
              {params.sort !== 'relevance' && <input type="hidden" name="sort" value={params.sort} />}

              <div className="relative">
                <input
                  type="text"
                  name="q"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder={t.inputPlaceholder}
                  aria-label={t.trigger}
                  autoComplete="off"
                  className="w-full px-6 py-4 pr-12 rounded-xl glass-surface border border-white/20 dark:border-white/10 bg-white/50 dark:bg-dark-white/10 text-neutral-darker dark:text-dark-neutral-darker placeholder-neutral-dark/50 dark:placeholder-dark-neutral-dark/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-primary hover:bg-primary-light/10 rounded-lg transition-colors"
                  aria-label={t.trigger}
                >
                  <FontAwesomeIcon icon={faSearch} className="w-5 h-5" />
                </button>

                {/* 建议（能力块 D：来自索引内容） */}
                {showSuggestions && suggestions.length > 0 && (
                  <ul
                    data-testid="search-suggestions"
                    className="absolute z-20 left-0 right-0 mt-2 py-2 rounded-xl bg-white dark:bg-dark-bg-secondary border border-neutral-light dark:border-dark-neutral-light shadow-lg text-left"
                  >
                    {suggestions.map((s: SearchSuggestion) => (
                      <li key={s.text}>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setQuery(s.text);
                            setShowSuggestions(false);
                            router.push(buildUrl({ q: s.text }));
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-light/60 dark:hover:bg-dark-neutral-light/40"
                        >
                          {s.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </form>

            {/* 筛选器（能力块 B）：类型 / 标签 / 排序 / 时间范围 */}
            <div
              data-testid="search-filters"
              className="p-4 rounded-xl glass-surface border border-white/20 dark:border-white/10 mb-6"
            >
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-neutral-darker dark:text-dark-neutral-darker">
                <FontAwesomeIcon icon={faFilter} className="w-3 h-3 text-primary" />
                {t.filters}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-xs text-neutral-dark dark:text-dark-neutral-dark">
                  {t.filterType}
                  <select
                    value={params.type || ''}
                    onChange={(e) => applyFilter({ type: e.target.value || null })}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-light dark:border-dark-neutral-light bg-transparent text-sm"
                  >
                    <option value="">{t.typeAll}</option>
                    <option value="blog">{t.typeBlog}</option>
                    <option value="project">{t.typeProject}</option>
                  </select>
                </label>

                <label className="text-xs text-neutral-dark dark:text-dark-neutral-dark">
                  {t.filterTag}
                  <select
                    value={params.tag || ''}
                    onChange={(e) => applyFilter({ tag: e.target.value || null })}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-light dark:border-dark-neutral-light bg-transparent text-sm"
                  >
                    <option value="">{t.tagAll}</option>
                    {tags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs text-neutral-dark dark:text-dark-neutral-dark">
                  {t.filterSort}
                  <select
                    value={params.sort}
                    // relevance 是默认值，归一化为不写入 URL，保持链接整洁
                    onChange={(e) => applyFilter({ sort: e.target.value === 'relevance' ? null : e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-light dark:border-dark-neutral-light bg-transparent text-sm"
                  >
                    <option value="relevance">{t.sortRelevance}</option>
                    <option value="newest">{t.sortNewest}</option>
                  </select>
                </label>

                <label className="text-xs text-neutral-dark dark:text-dark-neutral-dark">
                  {t.filterFrom}
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-light dark:border-dark-neutral-light bg-transparent text-sm"
                  />
                </label>

                <label className="text-xs text-neutral-dark dark:text-dark-neutral-dark">
                  {t.filterTo}
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-light dark:border-dark-neutral-light bg-transparent text-sm"
                  />
                </label>

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => applyFilter({ from: dateFrom || null, to: dateTo || null })}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm"
                  >
                    {t.applyFilters}
                  </button>
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                        router.push(buildUrl({ type: null, tag: null, sort: null, from: null, to: null }));
                      }}
                      className="px-3 py-2 rounded-lg border border-neutral-light dark:border-dark-neutral-light text-sm inline-flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                      {t.clearFilters}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {paramError && (
              <p
                data-testid="param-error"
                className="mb-4 text-sm text-red-600 dark:text-red-400 text-center"
              >
                {paramError}
              </p>
            )}

            {!showResults && (
              <div className="text-center">
                <p className="text-sm text-neutral-dark dark:text-dark-neutral-dark mb-4">
                  {t.popular}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {popularSearches[locale].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setQuery(term);
                        router.push(buildUrl({ q: term }));
                      }}
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
          {showResults && data.items.length > 0 ? (
            <div data-testid="search-results">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-neutral-darker dark:text-dark-neutral-darker mb-2">
                  {t.totalResults(data.total)}
                </h2>
                <p className="text-neutral-dark dark:text-dark-neutral-dark">
                  {t.resultsFor(data.total, params.q)}
                  {rangeText ? ` · ${rangeText}` : ''}
                </p>
              </div>

              <div className="space-y-6">
                {data.items.map((result) => (
                  <div
                    key={result.id}
                    data-result-id={result.id}
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
                            dangerouslySetInnerHTML={{ __html: highlight(result.title, params.q) }}
                          />
                          <span className="px-2 py-1 text-xs rounded-full bg-primary-light/20 text-primary dark:bg-dark-primary-light/20 dark:text-dark-primary whitespace-nowrap">
                            {result.type === 'blog' ? t.groupBlog : t.groupProject}
                          </span>
                        </div>

                        {result.excerpt && (
                          <p
                            className="text-neutral-dark dark:text-dark-neutral-dark mb-4 line-clamp-2 [&_mark]:bg-primary-light/40 [&_mark]:dark:bg-dark-primary/30 [&_mark]:text-inherit [&_mark]:rounded-sm"
                            dangerouslySetInnerHTML={{ __html: highlight(result.excerpt, params.q) }}
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
                          {((result.tags || result.technologies) ?? []).length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <FontAwesomeIcon icon={faTags} className="w-3 h-3" />
                              <span>
                                {((result.tags || result.technologies) ?? []).slice(0, 3).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 分页（能力块 B）：写历史，可分享/可回退 */}
              {data.totalPages > 1 && (
                <nav
                  data-testid="search-pagination"
                  className="mt-10 flex items-center justify-center gap-4"
                >
                  {data.page > 1 && (
                    <Link
                      href={buildUrl({ page: String(data.page - 1) }, false)}
                      className="px-4 py-2 rounded-lg glass-surface border border-white/20 dark:border-white/10"
                      rel="prev"
                    >
                      {t.prevPage}
                    </Link>
                  )}
                  <span className="text-sm text-neutral-dark dark:text-dark-neutral-dark">
                    {t.pageOf(data.page, data.totalPages)}
                  </span>
                  {data.page < data.totalPages && (
                    <Link
                      href={buildUrl({ page: String(data.page + 1) }, false)}
                      className="px-4 py-2 rounded-lg glass-surface border border-white/20 dark:border-white/10"
                      rel="next"
                    >
                      {t.nextPage}
                    </Link>
                  )}
                </nav>
              )}
            </div>
          ) : showResults ? (
            <div className="text-center py-16" data-testid="search-empty">
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
