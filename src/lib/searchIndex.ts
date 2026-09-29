import MiniSearch, { type Options, type SearchResult as MiniSearchResult } from 'minisearch';
import type { Locale } from '@/i18n/locales';
import {
  expandForIndex,
  expandForQuery,
  queryHighlightTerms,
  tokenizeText,
} from '@/lib/cjkTokenizer';

/**
 * 站内搜索的离线索引配置（前后端共享）。
 *
 * 设计目标：
 * - 同一套字段权重 / 分词 / 容错配置，服务端检索与客户端命令面板复用，结果一致。
 * - 文档保持精简（不含正文全文），索引体积小、客户端拉取快。
 * - **CJK 感知**：中文不再退化为「词头前缀匹配」，非词头子串（如「入门」「指南」「渲染」）可召回。
 *   分词细节见 `src/lib/cjkTokenizer.ts`。
 */

export type SearchDocType = 'blog' | 'project';

/** 进入索引的精简文档。所有可搜索文本都在这些字段里。 */
export interface SearchDoc {
  /** 形如 `blog:<notionId>` / `project:<notionId>`，作为 MiniSearch 主键，全局唯一。 */
  id: string;
  type: SearchDocType;
  /** Notion 原始 id（用于 React key 等）。 */
  refId: string;
  slug: string;
  title: string;
  /** 博客摘要或项目描述。 */
  excerpt: string;
  /** 标签（blog tags / project technologies 统一塞这里，作为关键词字段）。 */
  keywords: string[];
  /** ISO 日期，用于同分排序与展示。 */
  date: string;
  /** 仅 blog 有。 */
  readTime?: string;
  /** 内容语言（'English' | 'Chinese'），未标注则为空（视为中性、跨语言可见）。 */
  language?: string;
}

/** 客户端 / 服务端检索后返回给 UI 的结果项。 */
export interface SearchHit extends SearchDoc {
  /** 相关性得分（relevance 排序下可能已被时效加权）。 */
  score: number;
  /** 命中的字段（title/excerpt/keywords）。 */
  matchedFields: string[];
}

/** 字段权重：标题最高，其次关键词，再次摘要。 */
const FIELD_BOOST: Record<string, number> = {
  title: 4,
  keywords: 2,
  excerpt: 1,
};

/** 查询串长度上限：超长输入直接截断，避免构造超大 regex / 检索树（S12 健壮性）。 */
export const MAX_QUERY_LENGTH = 200;

/**
 * MiniSearch 选项。
 *
 * 分词分两侧（MiniSearch v7 支持索引侧与查询侧分别配置）：
 * - `tokenize`（索引侧，顶层）：切成 CJK 片段 / 拉丁词两类 token；
 * - `processTerm`（索引侧）：CJK 片段展开为 unigram ∪ bigram；
 * - `searchOptions.tokenize` / `searchOptions.processTerm`（查询侧）：CJK 片段只展开 bigram。
 *
 * 这样「入门」（查询）↔「Next.js 14 入门指南」（文档）能通过 bigram `入门` 对上，
 * 而不会因为查询侧的 unigram 展开把「入」「门」变成 OR 噪声。
 */
export const MINISEARCH_OPTIONS: Options<SearchDoc> = {
  idField: 'id',
  fields: ['title', 'excerpt', 'keywords'],
  storeFields: ['type', 'refId', 'slug', 'title', 'excerpt', 'keywords', 'date', 'readTime'],
  tokenize: (text: string) => tokenizeText(text),
  processTerm: (term: string) => expandForIndex(term),
  searchOptions: {
    boost: FIELD_BOOST,
    prefix: true,
    // 词越长容许的编辑距离越大；短词与 CJK bigram 不做模糊以免噪声。
    fuzzy: (term) => (term.length <= 3 ? false : 0.2),
    combineWith: 'AND',
    tokenize: (text: string) => tokenizeText(text),
    processTerm: (term: string) => expandForQuery(term),
  },
};

/** 由一组文档构建 MiniSearch 实例。 */
export function createSearchIndex(documents: SearchDoc[]): MiniSearch<SearchDoc> {
  const mini = new MiniSearch<SearchDoc>(MINISEARCH_OPTIONS);
  mini.addAll(documents);
  return mini;
}

/** 把索引序列化为可通过 JSON 传输的字符串（供 `/api/search/index` 直接下发，免客户端重建）。 */
export function serializeIndex(mini: MiniSearch<SearchDoc>): string {
  return JSON.stringify(mini);
}

/** 从序列化字符串恢复索引（客户端用）。 */
export function loadSerializedIndex(json: string): MiniSearch<SearchDoc> {
  return MiniSearch.loadJSON<SearchDoc>(json, MINISEARCH_OPTIONS);
}

/** 归一化查询串：去首尾空白 + 截断到上限。 */
export function normalizeQuery(query: string): string {
  return (query || '').trim().slice(0, MAX_QUERY_LENGTH);
}

/** 把 MiniSearch 原始结果统一成 SearchHit。 */
function toHit(r: MiniSearchResult & Partial<SearchDoc>): SearchHit {
  return {
    id: String(r.id),
    type: r.type as SearchDocType,
    refId: r.refId as string,
    slug: r.slug as string,
    title: r.title as string,
    excerpt: (r.excerpt as string) || '',
    keywords: (r.keywords as string[]) || [],
    date: (r.date as string) || '',
    readTime: r.readTime as string | undefined,
    score: r.score,
    matchedFields: Object.keys(r.match || {}).length
      ? Array.from(new Set(Object.values(r.match || {}).flat()))
      : [],
  };
}

/**
 * 执行查询并返回**全部**命中（未分页），供上层过滤 / 排序 / 分页。
 * 空查询返回 []。
 */
export function runSearchAll(mini: MiniSearch<SearchDoc>, query: string): SearchHit[] {
  const q = normalizeQuery(query);
  if (!q) return [];
  // 归一化后仍有内容即可检索。纯标点/空白查询由 MiniSearch 的分词器自然切空
  // （tokenizeText 对无字母数字的输入产出空 token 列表），从而安全返回 []。
  const raw = mini.search(q) as Array<MiniSearchResult & Partial<SearchDoc>>;
  return raw.map(toHit);
}

/** 执行查询并归一化为 SearchHit[]（保留 limit 语义，向后兼容既有调用方）。 */
export function runSearch(mini: MiniSearch<SearchDoc>, query: string, limit = 20): SearchHit[] {
  return runSearchAll(mini, query).slice(0, Math.max(0, limit));
}

/**
 * 在纯文本里按查询词高亮，返回带 `<mark>` 的安全 HTML 片段。
 *
 * 安全性：**先转义再注入 `<mark>`**，且只注入 `<mark>`/`</mark>` 两个标签，
 * 文本中的 `<` `>` `&` 一律转义，因此 HTML 注入不成立（S12）。
 *
 * CJK 适配：高亮词取自查询的「原始词面」（CJK 整段、拉丁词归一化形式），
 * 不做 bigram 拆解，避免把「入门指南」高亮成碎片。
 * 拉丁词允许字符间出现分隔符，使 `nextjs` 能高亮 `Next.js`。
 */
export function highlight(text: string, query: string, snippetRadius?: number): string {
  if (!text) return '';

  const terms = queryHighlightTerms(normalizeQuery(query)).filter((t) => t.length >= 2);

  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (terms.length === 0) {
    const base = snippetRadius ? text.slice(0, snippetRadius * 2) : text;
    return escape(base);
  }

  // 可选：裁剪出第一个命中词附近的片段。
  let working = text;
  if (snippetRadius) {
    const lower = text.toLowerCase();
    const firstIdx = terms
      .map((t) => lower.indexOf(t.toLowerCase()))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b)[0];
    if (firstIdx !== undefined && firstIdx > snippetRadius) {
      const start = Math.max(0, firstIdx - snippetRadius);
      working = (start > 0 ? '…' : '') + text.slice(start, firstIdx + snippetRadius * 2);
    } else {
      working = text.slice(0, snippetRadius * 3);
    }
  }

  // 逐字符转义后再用「字符间允许分隔符」的模式匹配，兼顾 next.js / nextjs / next js。
  const SEP = '[\\s._/\\-]*';
  const pattern = new RegExp(
    `(${terms
      .map((t) =>
        Array.from(t)
          .map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join(SEP),
      )
      .join('|')})`,
    'gi',
  );

  return escape(working).replace(pattern, '<mark>$1</mark>');
}

/** 把 locale 映射为 Notion `Language` 字段使用的名称。 */
export function localeToLanguage(locale: Locale): 'English' | 'Chinese' {
  return locale === 'zh' ? 'Chinese' : 'English';
}

/**
 * 命令面板 / 搜索页共享的本地化文案。
 *
 * 项目实际未挂载 NextIntlClientProvider（历史包袱），搜索域沿用「locale 文案对象」模式。
 * EN / ZH 两份 **key 必须成对齐全**，由 `src/lib/__tests__/searchI18n.test.ts` 断言。
 */
export const searchTexts = {
  en: {
    placeholder: 'Search articles and projects…',
    trigger: 'Search',
    loading: 'Loading index…',
    searching: 'Searching…',
    empty: 'Type to search blog posts and projects',
    noResults: 'No results found',
    noResultsHint: 'Try different keywords',
    groupBlog: 'Blog',
    groupProject: 'Projects',
    resultsFor: (n: number, q: string) => `Found ${n} result${n === 1 ? '' : 's'} for “${q}”`,
    navHint: '↑↓ to navigate · ↵ to open · esc to close',
    demoFallback: 'Live search unavailable, showing server results',
    pageTitle: 'Search Content',
    pageSubtitle: 'Search blog posts, projects, and related technical content',
    inputPlaceholder: 'Enter keywords to search…',
    popular: 'Popular Searches',
    browseBlog: 'Browse Blog',
    browseProjects: 'View Projects',
    // --- 能力块 B/C/D/G 新增 ---
    suggestions: 'Suggestions',
    filters: 'Filters',
    filterType: 'Content type',
    typeAll: 'All',
    typeBlog: 'Blog',
    typeProject: 'Projects',
    filterTag: 'Tag',
    tagAll: 'All tags',
    filterSort: 'Sort by',
    sortRelevance: 'Relevance',
    sortNewest: 'Newest',
    filterFrom: 'From',
    filterTo: 'To',
    applyFilters: 'Apply',
    clearFilters: 'Clear filters',
    activeFilters: 'Active filters',
    prevPage: 'Previous',
    nextPage: 'Next',
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
    showingRange: (from: number, to: number, total: number) => `Showing ${from}–${to} of ${total}`,
    totalResults: (n: number) => `${n} result${n === 1 ? '' : 's'}`,
    viewAllResults: 'View all results',
    loadingSuggestions: 'Loading suggestions…',
    relatedTitle: 'Related content',
    relatedEmpty: 'No related content yet',
    relatedReasonTags: (tags: string) => `Shares ${tags}`,
    relatedReasonSameType: 'More in this section',
    relatedReasonTopic: 'Related topic',
    searchAnalyticsTitle: 'Search Analytics',
  },
  zh: {
    placeholder: '搜索文章和项目…',
    trigger: '搜索',
    loading: '加载索引中…',
    searching: '搜索中…',
    empty: '输入关键词搜索文章和项目',
    noResults: '没有找到相关内容',
    noResultsHint: '尝试使用其他关键词',
    groupBlog: '博客',
    groupProject: '项目',
    resultsFor: (n: number, q: string) => `找到 ${n} 个与 “${q}” 相关的结果`,
    navHint: '↑↓ 选择 · ↵ 打开 · esc 关闭',
    demoFallback: '实时搜索不可用，显示服务端结果',
    pageTitle: '搜索内容',
    pageSubtitle: '搜索博客文章、项目和相关技术内容',
    inputPlaceholder: '输入关键词搜索…',
    popular: '热门搜索',
    browseBlog: '浏览博客',
    browseProjects: '查看项目',
    // --- 能力块 B/C/D/G 新增 ---
    suggestions: '搜索建议',
    filters: '筛选',
    filterType: '内容类型',
    typeAll: '全部',
    typeBlog: '博客',
    typeProject: '项目',
    filterTag: '标签',
    tagAll: '全部标签',
    filterSort: '排序方式',
    sortRelevance: '相关度',
    sortNewest: '最新',
    filterFrom: '起始日期',
    filterTo: '结束日期',
    applyFilters: '应用筛选',
    clearFilters: '清除筛选',
    activeFilters: '已选筛选',
    prevPage: '上一页',
    nextPage: '下一页',
    pageOf: (page: number, total: number) => `第 ${page} 页，共 ${total} 页`,
    showingRange: (from: number, to: number, total: number) => `显示第 ${from}–${to} 条，共 ${total} 条`,
    totalResults: (n: number) => `共 ${n} 个结果`,
    viewAllResults: '查看全部结果',
    loadingSuggestions: '加载建议中…',
    relatedTitle: '相关内容',
    relatedEmpty: '暂无相关推荐',
    relatedReasonTags: (tags: string) => `共同标签：${tags}`,
    relatedReasonSameType: '同类内容',
    relatedReasonTopic: '相关主题',
    searchAnalyticsTitle: '搜索分析',
  },
} as const;

/** 静态热门词：索引为空或前缀为空时兜底（能力块 D 的 fallback 来源）。 */
export const popularSearches: Record<Locale, string[]> = {
  en: ['Next.js', 'TypeScript', 'React', 'AI', 'Machine Learning', 'Notion'],
  zh: ['Next.js', 'TypeScript', 'React', 'AI', '人工智能', 'Notion'],
};

/** 搜索域文案类型（两侧 key 必须一致）。 */
export type SearchTexts = typeof searchTexts.en;
