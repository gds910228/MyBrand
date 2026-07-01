'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MiniSearch from 'minisearch';
import {
  createSearchIndex,
  runSearch,
  type SearchDoc,
  type SearchHit,
} from '@/lib/searchIndex';
import type { Locale } from '@/i18n/locales';

/**
 * 客户端搜索 hook：加载索引（模块级缓存，跨组件复用，重开面板不重复拉取）、
 * 用 MiniSearch 做模糊/前缀检索、内置防抖、按类型分组。
 */

type IndexState = MiniSearch<SearchDoc> | null;

// 模块级缓存：每个 locale 只构建一次索引；in-flight Promise 去重并发请求。
const indexCache: Partial<Record<Locale, MiniSearch<SearchDoc>>> = {};
const inflight: Partial<Record<Locale, Promise<MiniSearch<SearchDoc>>>> = {};

async function fetchIndex(locale: Locale): Promise<MiniSearch<SearchDoc>> {
  if (indexCache[locale]) return indexCache[locale]!;
  if (inflight[locale]) return inflight[locale]!;

  const p = (async () => {
    const res = await fetch(`/api/search/index?locale=${locale}`);
    if (!res.ok) throw new Error(`index fetch failed: ${res.status}`);
    const data = (await res.json()) as { documents: SearchDoc[] };
    const index = createSearchIndex(data.documents || []);
    indexCache[locale] = index;
    return index;
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

export function useSearch(
  locale: Locale,
  options?: { enabled?: boolean; debounceMs?: number; initialQuery?: string },
): UseSearchResult {
  const { enabled = true, debounceMs = 150, initialQuery = '' } = options || {};

  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [index, setIndex] = useState<IndexState>(indexCache[locale] || null);
  const [status, setStatus] = useState<UseSearchResult['status']>('idle');
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // 启用时加载索引（命中模块缓存则瞬时返回）。
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    if (indexCache[locale]) {
      setIndex(indexCache[locale]!);
      setStatus('ready');
      return;
    }

    setStatus('loading-index');
    fetchIndex(locale)
      .then((idx) => {
        if (cancelled) return;
        setIndex(idx);
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
    if (!index || !debounced.trim()) return EMPTY;
    const hits = runSearch(index, debounced, 30);
    const blog = hits.filter((h) => h.type === 'blog');
    const project = hits.filter((h) => h.type === 'project');
    // 扁平顺序：保持「博客在前、项目在后」与 UI 分组渲染一致，便于键盘导航。
    return { blog, project, flat: [...blog, ...project] };
  }, [index, debounced]);

  const liveStatus: UseSearchResult['status'] =
    status === 'loading-index' || status === 'error'
      ? status
      : query !== debounced
        ? 'searching'
        : 'ready';

  const reset = useCallback(() => setQuery(''), []);
  void reset;

  return {
    query,
    setQuery,
    results,
    total: results.flat.length,
    status: enabled ? liveStatus : 'idle',
    indexReady: !!index,
    error,
  };
}
