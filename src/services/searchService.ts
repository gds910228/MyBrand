/**
 * 统一检索服务层（feat-search-discovery-20260928，T10）。
 *
 * 唯一入口：`searchContent(params)`。
 * 供 `/api/search`（API）、`/search` 与 `/zh/search`（SSR 直出）、以及建议/推荐模块复用，
 * 确保**服务端与客户端共用同一套索引、过滤与排序口径**（决策 D-08 / D-11，验收项 S18）。
 *
 * 管线：缓存索引 → 检索 → 结构化过滤 → 时效加权 → 排序 → 分页。
 */
import type { SearchDoc, SearchHit } from '@/lib/searchIndex';
import { getCachedIndex } from '@/lib/searchIndexCache';
import { paginate, parseSearchQuery, type Paginated, type SearchParamsInput } from '@/lib/searchQuery';
import { rankingReferenceTime } from '@/lib/searchRanking';
import { rankDocs } from '@/lib/searchPipeline';
import { createSearchEvent } from '@/lib/searchAnalytics';
import { recordEvent } from '@/lib/searchEventStore';
import type { ParsedSearchQuery, SearchResultItem } from '@/types/search';

/** 把内部 SearchHit 转为对外响应项（统一 id 口径 + 保留 refId 兼容旧字段）。 */
export function toResultItem(hit: SearchHit): SearchResultItem {
  const base: SearchResultItem = {
    id: hit.id,
    refId: hit.refId,
    slug: hit.slug,
    title: hit.title,
    excerpt: hit.excerpt,
    type: hit.type,
    date: hit.date,
    score: hit.score,
    matchedFields: hit.matchedFields,
  };

  if (hit.type === 'blog') {
    base.tags = hit.keywords;
    if (hit.readTime) base.readTime = hit.readTime;
  } else {
    base.technologies = hit.keywords;
  }

  return base;
}

/**
 * 检索 + 过滤 + 排序（**不分页**）。这是服务端与客户端共享的核心排序管线。
 * 返回的命中已按 `params.sort` 排好序，且 relevance 排序下已叠加时效加权。
 */
export async function collectRankedHits(
  params: ParsedSearchQuery,
  now: number = rankingReferenceTime(),
): Promise<SearchHit[]> {
  if (!params.q) return [];

  const { index, docs } = await getCachedIndex(params.locale);

  // 与客户端 useSearch 共用 `rankDocs`，保证两端 id 序列一致（S18）。
  return rankDocs(index, docs, params, now);
}

export interface SearchOutcome extends Paginated<SearchResultItem> {
  query: string;
  sort: ParsedSearchQuery['sort'];
  tookMs: number;
  /**
   * 过滤后、分页前的全部命中。已排序，供建议/推荐等同进程调用方复用；
   * **不进入 API 响应体**（响应只暴露当前页）。
   */
  allHits: SearchHit[];
}

/** 执行一次完整检索（检索 → 过滤 → 排序 → 分页）。 */
export async function searchContent(
  params: ParsedSearchQuery,
  options?: { now?: number },
): Promise<SearchOutcome> {
  const started = Date.now();
  const now = options?.now ?? rankingReferenceTime();

  const ranked = await collectRankedHits(params, now);
  const page = paginate(ranked, params.page, params.pageSize);

  return {
    ...page,
    items: page.items.map(toResultItem),
    query: params.q,
    sort: params.sort,
    tookMs: Date.now() - started,
    allHits: ranked,
  };
}

/** 只取已排序命中（不分页），供内部调用方使用。 */
export async function searchDocs(
  params: ParsedSearchQuery,
  options?: { now?: number },
): Promise<SearchHit[]> {
  return collectRankedHits(params, options?.now ?? rankingReferenceTime());
}

/**
 * 取某语言的完整索引文档集（供相关推荐等需要「同语言全量文档」的场景复用同一缓存）。
 * 注意：这是**进程内缓存**读取，不产生 Notion 往返。
 */
export async function getIndexDocs(locale: ParsedSearchQuery['locale']): Promise<SearchDoc[]> {
  const { docs } = await getCachedIndex(locale);
  return docs;
}

/** 搜索页 SSR 需要的数据包（能力块 G）。 */
export interface SearchPagePayload {
  params: ParsedSearchQuery;
  data: {
    items: SearchResultItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    tookMs: number;
  };
  /** 当前索引中出现的全部标签（去重、字典序），供筛选下拉。 */
  tags: string[];
  /** 参数解析失败提示（非法 type / sort / 日期）。非法参数不抛错，降级为空结果 + 提示。 */
  paramError?: string;
}

/** 单次查询允许返回给筛选下拉的最大标签数（避免超长下拉）。 */
const MAX_FILTER_TAGS = 40;

/**
 * 搜索页服务端装载：解析 URL 参数 → 检索 → 汇总分页元信息与可选标签。
 *
 * 这是 `/search` 与 `/zh/search` 的**唯一**数据入口，保证 EN/ZH 两套页面口径完全一致。
 * 参数非法时**不抛错**：返回空结果 + `paramError` 文案，页面照常 200 渲染。
 */
export async function loadSearchPageData(
  locale: ParsedSearchQuery['locale'],
  searchParams: SearchParamsInput,
): Promise<SearchPagePayload> {
  const parsed = parseSearchQuery(searchParams);

  if (!parsed.ok || !parsed.params) {
    return {
      params: { q: '', type: null, tag: null, from: null, to: null, locale, sort: 'relevance', page: 1, pageSize: 20 },
      data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0, tookMs: 0 },
      tags: [],
      paramError: parsed.error,
    };
  }

  // URL 未指定 locale 时以页面语言为准（/zh/search 必须检索中文索引）。
  const params: ParsedSearchQuery = { ...parsed.params, locale };


  const [outcome, docs] = await Promise.all([
    params.q
      ? searchContent(params)
      : Promise.resolve(null),
    getIndexDocs(locale),
  ]);

  const tagSet = new Set<string>();
  for (const d of docs) {
    for (const k of d.keywords || []) {
      const tag = String(k).trim();
      if (tag) tagSet.add(tag);
    }
  }
  const tags = Array.from(tagSet)
    .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0))
    .slice(0, MAX_FILTER_TAGS);

  // 搜索行为分析（能力块 E）：**搜索页（SSR）才是真实访客的主要入口**，
  // 若只在 /api/search 埋点，运营看到的热门词将只反映直接调 API 的流量。
  // 因此这里同样记录；recordEvent 是纯内存写、无 I/O，不阻塞渲染；
  // 且包在 try/catch 中，分析失败绝不影响页面。
  if (params.q && outcome) {
    try {
      recordEvent(
        createSearchEvent({
          query: params.q,
          locale,
          resultCount: outcome.total,
          type: params.type,
          tag: params.tag,
          sort: params.sort,
        }),
      );
    } catch (analyticsError) {
      console.warn('[searchPage] analytics record failed:', analyticsError);
    }
  }

  return {
    params,
    data: {
      items: outcome?.items ?? [],
      total: outcome?.total ?? 0,
      page: outcome?.page ?? params.page,
      pageSize: outcome?.pageSize ?? params.pageSize,
      totalPages: outcome?.totalPages ?? 0,
      tookMs: outcome?.tookMs ?? 0,
    },
    tags,
  };
}
