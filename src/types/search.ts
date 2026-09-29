/**
 * 搜索域跨层共享类型（feat-search-discovery-20260928，T07；评审 spec_review_v1 C-6）。
 *
 * 依据 `.harness/rules/工程结构.md`「类型放置」：**跨组件/跨层共享**的类型放 `src/types/`。
 * `SearchDoc` / `SearchHit` 沿用既有位置（`src/lib/searchIndex.ts`）以保持既有 import 稳定，
 * 在此 re-export，使 `src/types/search.ts` 成为搜索契约的统一出口。
 */
import type { Locale } from '@/i18n/locales';
import type { SearchDoc, SearchDocType, SearchHit } from '@/lib/searchIndex';
import type { SortMode } from '@/lib/searchRanking';

export type { SearchDoc, SearchDocType, SearchHit, SortMode };

/** 归一化后的搜索查询参数（解析成功后）。 */
export interface ParsedSearchQuery {
  /** 自由文本，已 trim + 截断到 MAX_QUERY_LENGTH。 */
  q: string;
  /** 内容类型过滤；null = 不限。 */
  type: SearchDocType | null;
  /** 标签过滤（大小写不敏感精确匹配 keywords 数组元素）；null = 不限。 */
  tag: string | null;
  /** 起始日期（含边界，`YYYY-MM-DD`）；null = 不限。 */
  from: string | null;
  /** 结束日期（含边界，`YYYY-MM-DD`）；null = 不限。 */
  to: string | null;
  locale: Locale;
  sort: SortMode;
  /** 从 1 开始。 */
  page: number;
  pageSize: number;
}

/** 参数解析结果：解析失败一律走 400，绝不抛异常。 */
export interface ParseSearchQueryResult {
  ok: boolean;
  params?: ParsedSearchQuery;
  /** 失败原因（用于 400 响应体）。 */
  error?: string;
}

/** `/api/search` 的响应体（向后兼容：保留 results / count / query）。 */
export interface SearchResponse {
  results: SearchResultItem[];
  /** 本页条数（旧字段，语义不变）。 */
  count: number;
  /** 原始查询串（旧字段）。 */
  query: string;
  /** 过滤后总数（新增）。 */
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sort: SortMode;
  filters: {
    type: SearchDocType | null;
    tag: string | null;
    from: string | null;
    to: string | null;
  };
  tookMs: number;
}

/** 响应中的单条结果。 */
export interface SearchResultItem {
  /** 全局唯一文档 id，形如 `blog:post-1`（客户端 SearchHit.id 同口径，供 S18 比较）。 */
  id: string;
  /** 原始内容 id（Notion page id 或本地种子 id），保留旧口径兼容。 */
  refId: string;
  slug: string;
  title: string;
  excerpt: string;
  type: SearchDocType;
  date: string;
  score: number;
  matchedFields: string[];
  /** blog：标签。 */
  tags?: string[];
  /** project：技术栈。 */
  technologies?: string[];
  readTime?: string;
}

/** 搜索建议项。 */
export interface SearchSuggestion {
  text: string;
  /** 命中的文档数（用于排序与展示）。 */
  count: number;
}

/** 建议端点响应。 */
export interface SuggestResponse {
  prefix: string;
  locale: Locale;
  suggestions: SearchSuggestion[];
  /** index = 来自当前索引内容；fallback = 静态热门词兜底。 */
  source: 'index' | 'fallback';
}

/** 分析聚合结果。 */
export interface SearchAnalyticsSummary {
  totalSearches: number;
  uniqueQueries: number;
  /** 热门词（按次数降序，同次数按词条字典序）。 */
  topQueries: Array<{ query: string; count: number; zeroResultCount: number }>;
  /** 零结果词。 */
  zeroResultQueries: Array<{ query: string; count: number }>;
}

/** 相关内容推荐项（能力块 F）。 */
export interface RelatedItem {
  id: string;
  refId: string;
  slug: string;
  title: string;
  excerpt: string;
  type: SearchDocType;
  date: string;
  keywords: string[];
  score: number;
  /** 与当前内容共享的标签。 */
  sharedTags: string[];
  sameType: boolean;
  /** 本地化后的推荐理由文案。 */
  reason: string;
}
