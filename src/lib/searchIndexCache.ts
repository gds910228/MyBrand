/**
 * 搜索索引进程内缓存（feat-search-discovery-20260928，T08；验收项 S24）。
 *
 * 为什么需要它：`/api/search` 每个请求都会 `getSearchDocuments()` → `createSearchIndex()`。
 * 文档集构建虽走列表接口（无 N+1），但重复建索引仍是纯浪费。本模块按 locale 缓存
 * 已建好的 MiniSearch 实例，TTL 内连续请求**不重复构建**。
 *
 * 为什么钉在 `globalThis`（评审 spec_review_v1 D-5 / 决策 D-09）：
 * `next dev` 下不同 route 可能是**不同的模块实例**，模块级 `let cache = ...` 未必被
 * `/api/search`、`/api/search/suggest`、`/search` 页面共享，会导致缓存命中率与
 * 观测数据失真。钉到 `globalThis` 可保证同一 Node 进程内单例。
 *
 * 适用边界（**遗留项**）：内存实现仅适用于 dev / 单实例部署。
 * 多实例（serverless / 多副本）下每个实例各有一份缓存，属预期行为——
 * 此时应换成外部缓存（Redis 等）。已记入遗留问题清单。
 */
import MiniSearch from 'minisearch';
import { createSearchIndex, type SearchDoc } from '@/lib/searchIndex';
import { getSearchDocuments } from '@/services/searchData';
import type { Locale } from '@/i18n/locales';

/** 索引缓存 TTL：5 分钟。须 ≥ 上游 `getAllBlogPosts` 的 60s 列表缓存，避免比它更早过期。 */
export const INDEX_CACHE_TTL_MS = 5 * 60 * 1000;

export interface CachedIndex {
  index: MiniSearch<SearchDoc>;
  docs: SearchDoc[];
  builtAt: number;
  locale: Locale;
}

interface IndexCacheState {
  entries: Map<Locale, CachedIndex>;
  /** 每个 locale 实际构建索引的次数——S24「连续请求不重复构建」的直接证据。 */
  buildCounts: Map<Locale, number>;
}

const GLOBAL_KEY = '__misotech_search_index_cache__';

function getState(): IndexCacheState {
  const g = globalThis as unknown as Record<string, IndexCacheState | undefined>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = { entries: new Map(), buildCounts: new Map() };
  }
  return g[GLOBAL_KEY]!;
}

export interface GetIndexResult extends CachedIndex {
  /** 本次调用是否命中缓存（false = 实际构建了新索引）。 */
  cached: boolean;
}

/**
 * 取指定语言的搜索索引（带 TTL 缓存）。
 * 并发调用会各自构建——本项目请求量下可接受，且构建本身不慢；
 * 若将来成为热点，可加 in-flight Promise 去重（`useSearch` 客户端侧已有该模式）。
 */
export async function getCachedIndex(locale: Locale): Promise<GetIndexResult> {
  const state = getState();
  const now = Date.now();
  const hit = state.entries.get(locale);

  if (hit && now - hit.builtAt < INDEX_CACHE_TTL_MS) {
    return { ...hit, cached: true };
  }

  const docs = await getSearchDocuments(locale);
  const index = createSearchIndex(docs);
  const entry: CachedIndex = { index, docs, builtAt: now, locale };

  state.entries.set(locale, entry);
  state.buildCounts.set(locale, (state.buildCounts.get(locale) || 0) + 1);

  return { ...entry, cached: false };
}

/** 观测用：某语言的索引构建次数（S24 证据）。 */
export function getIndexBuildCount(locale: Locale): number {
  return getState().buildCounts.get(locale) || 0;
}

/** 观测用：全部构建次数。 */
export function getTotalIndexBuildCount(): number {
  const state = getState();
  let total = 0;
  state.buildCounts.forEach((n) => {
    total += n;
  });
  return total;
}

/** 主动失效（内容变更后可调用；当前由 TTL 兜底）。 */
export function invalidateSearchIndexCache(locale?: Locale): void {
  const state = getState();
  if (locale) {
    state.entries.delete(locale);
    return;
  }
  state.entries.clear();
}

/** 测试专用：清空缓存与计数。 */
export function resetSearchIndexCacheForTest(): void {
  const state = getState();
  state.entries.clear();
  state.buildCounts.clear();
}
