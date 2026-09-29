/**
 * 检索管线（feat-search-discovery-20260928，T10/T16）。
 *
 * **服务端与客户端共用同一套排序实现**——这是验收项 S18（两端同一查询返回一致 id 序列）
 * 能够被**证明**而非「大致相同」的前提（决策 D-08）。
 * 服务端 `src/services/searchService.ts` 与客户端 `src/hooks/useSearch.ts` 都调用这里的
 * `rankDocs`，配合 `rankingReferenceTime()` 的小时取整基准，两侧对同一 (index, params, 时间桶)
 * 输入产出完全一致的序列。
 *
 * 纯函数模块：不读写缓存/网络，便于单测。
 */
import type MiniSearch from 'minisearch';
import { runSearchAll, type SearchDoc, type SearchHit } from '@/lib/searchIndex';
import { matchesFilters } from '@/lib/searchQuery';
import { applyRecencyWeight, rankingReferenceTime, sortHits } from '@/lib/searchRanking';
import type { ParsedSearchQuery } from '@/types/search';

/** 构造一份带默认值的查询参数（客户端预览与测试用）。 */
export function defaultParams(overrides?: Partial<ParsedSearchQuery>): ParsedSearchQuery {
  return {
    q: '',
    type: null,
    tag: null,
    from: null,
    to: null,
    locale: 'en',
    sort: 'relevance',
    page: 1,
    pageSize: 20,
    ...overrides,
  };
}

/**
 * 检索 + 结构化过滤 + 排序（不分页）。
 *
 * @param index  已建好的 MiniSearch 索引（服务端来自缓存，客户端来自 /api/search/index）
 * @param docs   与索引同源的文档集（用于结构化过滤取字段）
 * @param params 查询参数
 * @param now    排序基准时间，默认按小时取整（保证两端一致）
 */
export function rankDocs(
  index: MiniSearch<SearchDoc>,
  docs: SearchDoc[],
  params: ParsedSearchQuery,
  now: number = rankingReferenceTime(),
): SearchHit[] {
  if (!params.q) return [];

  const docsById = new Map<string, SearchDoc>();
  for (const d of docs) docsById.set(d.id, d);

  // 结构化过滤放在检索之后：过滤条件与相关性无关，后置过滤语义更清晰、也更易单测。
  const filtered = runSearchAll(index, params.q).filter((h) => {
    const doc = docsById.get(h.id);
    return !!doc && matchesFilters(doc, params);
  });

  // relevance 排序叠加时效加权；newest 排序不叠加（加权会破坏纯时间排序的语义）。
  return params.sort === 'relevance'
    ? sortHits(applyRecencyWeight(filtered, now), 'relevance')
    : sortHits(filtered, 'newest');
}
