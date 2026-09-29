'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MiniSearch from 'minisearch';
import {
  createSearchIndex,
  type SearchDoc,
  type SearchHit,
  type SearchDocType,
} from '@/lib/searchIndex';
import { defaultParams, rankDocs } from '@/lib/searchPipeline';
import { rankingReferenceTime, type SortMode } from '@/lib/searchRanking';
import type { Locale } from '@/i18n/locales';
import type { SuggestResponse } from '@/types/search';

/**
 * 客户端搜索 hook：加载索引（模块级缓存，跨组件复用，重开面板不重复拉取）、
 * 检索、防抖、按类型分组。
 *
 * **与改造前的重要差异（feat-search-discovery-20260928，决策 D-08 / D-11）**：
 * - 排序改为调用 `src/lib/searchPipeline.rankDocs` —— 与服务端 `searchService` **同一个函数**，
 *   配合按小时取整的 `rankingReferenceTime()`，保证两端口径一致（验收项 S18）；
 * - 新增 `type` / `tag` / `sort` 参数，使命令面板与服务端过滤口径一致；
 * - 索引缓存同时保留 `docs`（结构化过滤需要按 id 取字段）。
 *
 * 用途边界：命令面板（快速跳转）与搜索页的**输入预览**。
 * `/search` 页的结果列表以**服务端 URL 驱动**的结果为准（决策 D-11）。
 */

type IndexBundle = { index: MiniSearch<SearchDoc>; docs: SearchDoc[] };

// 模块级缓存：每个 locale 只构建一次索引；in-flight Promise 去重并发请求。
const indexCache: Partial<Record<Locale, IndexBundle>> = {};
const inflight: Partial<Record<Locale, Promise<IndexBundle>>> = {};

async function fetchIndex(locale: Locale): Promise<IndexBundle> {
  if (indexCache[locale]) return indexCache[locale]!;
  if (inflight[locale]) return inflight[locale]!;

  const p = (async () => {
    const res = await fetch(`/api/search/index?locale=${locale}`);
    if (!res.ok) throw new Error(`index fetch failed: ${res.status}`);
    const data = (await res.json()) as { documents: SearchDoc[] };
    const docs = data.documents || [];
    const bundle: IndexBundle = { index: createSearchIndex(docs), docs };
    indexCache[locale] = bundle;
    return bundle;
  })();

  inflight[locale] = p;
  try {
    return await p;
  } finally {
    delete inflight[locale];
  }
}

export interface GroupedHits {
  blog: SearchHit[];
  project: SearchHit[];
  /** 扁平顺序（用于键盘上下导航的全局索引）。 */
  flat: SearchHit[];
}

export interface UseSearchOptions {
  enabled?: boolean;
  debounceMs?: number;
  initialQuery?: string;
  /** 与服务端一致的结构化过滤（决策 D-11）。 */
  type?: SearchDocType | null;
  tag?: string | null;
  sort?: SortMode;
}

export interface UseSearchResult {
  query: string;
  setQuery: (q: string) => void;
  results: GroupedHits;
  total: number;
  status: 'idle' | 'loading-index' | 'searching' | 'ready' | 'error';
  /** 索引是否就绪（用于 UI 提示）。 */
  indexReady: boolean;
  error: string | null;
}

const EMPTY: GroupedHits = { blog: [], project: [], flat: [] };

export function useSearch(locale: Locale, options?: UseSearchOptions): UseSearchResult {
  const {
    enabled = true,
    debounceMs = 150,
    initialQuery = '',
    type = null,
    tag = null,
    sort = 'relevance',
  } = options || {};

  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [bundle, setBundle] = useState<IndexBundle | null>(indexCache[locale] || null);
  const [status, setStatus] = useState<UseSearchResult['status']>('idle');
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // 启用时加载索引（命中模块缓存则瞬时返回）。
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    if (indexCache[locale]) {
      setBundle(indexCache[locale]!);
      setStatus('ready');
      return;
    }

    setStatus('loading-index');
    fetchIndex(locale)
      .then((b) => {
        if (cancelled) return;
        setBundle(b);
        setStatus('ready');
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('[useSearch] load index failed:', e);
        setError(e instanceof Error ? e.message : 'index error');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [locale, enabled]);

  // 防抖 query。
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(query), debounceMs);
    return () => clearTimeout(debounceRef.current);
  }, [query, debounceMs]);

  const results = useMemo<GroupedHits>(() => {
    if (!bundle || !debounced.trim()) return EMPTY;

    const params = defaultParams({ q: debounced, locale, type, tag, sort });
    // 与服务端共用同一排序函数 + 同一小时取整基准 → 两端 id 序列一致（S18）。
    const hits = rankDocs(bundle.index, bundle.docs, params, rankingReferenceTime());

    const blog = hits.filter((h) => h.type === 'blog');
    const project = hits.filter((h) => h.type === 'project');
    // 扁平顺序：保持「博客在前、项目在后」与 UI 分组渲染一致，便于键盘导航。
    return { blog, project, flat: [...blog, ...project] };
  }, [bundle, debounced, locale, type, tag, sort]);

  const liveStatus: UseSearchResult['status'] =
    status === 'loading-index' || status === 'error'
      ? status
      : query !== debounced
        ? 'searching'
        : 'ready';

  return {
    query,
    setQuery,
    results,
    total: results.flat.length,
    status: enabled ? liveStatus : 'idle',
    indexReady: !!bundle,
    error,
  };
}

/**
 * 搜索建议 hook（能力块 D）：基于**当前索引内容**的前缀建议。
 * 空 prefix 时不发请求，直接返回空列表。
 */
export function useSuggestions(
  locale: Locale,
  prefix: string,
  options?: { enabled?: boolean; debounceMs?: number; limit?: number },
): { suggestions: SuggestResponse['suggestions']; loading: boolean } {
  const { enabled = true, debounceMs = 150, limit = 8 } = options || {};
  const [suggestions, setSuggestions] = useState<SuggestResponse['suggestions']>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = prefix.trim();
    if (!enabled || !trimmed) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggest?prefix=${encodeURIComponent(trimmed)}&locale=${locale}&limit=${limit}`,
        );
        if (!res.ok) throw new Error(`suggest failed: ${res.status}`);
        const data = (await res.json()) as SuggestResponse;
        if (!cancelled) setSuggestions(data.suggestions || []);
      } catch (e) {
        // 建议是增强能力，失败静默降级为空列表，不打扰用户。
        console.warn('[useSuggestions] failed:', e);
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [locale, prefix, enabled, debounceMs, limit]);

  return { suggestions, loading };
}

/** 测试/登出等场景下清空客户端索引缓存。 */
export function clearClientIndexCache(): void {
  (Object.keys(indexCache) as Locale[]).forEach((k) => delete indexCache[k]);
}
