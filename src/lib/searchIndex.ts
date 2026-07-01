import MiniSearch, { type Options, type SearchResult as MiniSearchResult } from 'minisearch';
import type { Locale } from '@/i18n/locales';

/**
 * 站内搜索的离线索引配置（前后端共享）。
 *
 * 设计目标：
 * - 用 MiniSearch 替代原先的朴素子串匹配 + 对前 10 篇文章逐篇拉全文（N+1）。
 * - 同一套字段权重 / 分词 / 容错配置，服务端兜底与客户端命令面板复用，结果一致。
 * - 文档保持精简（不含正文全文），索引体积小、客户端拉取快。
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
}

/** 客户端 / 服务端检索后返回给 UI 的结果项。 */
export interface SearchHit extends SearchDoc {
  /** MiniSearch 相关性得分。 */
  score: number;
  /** 命中的字段（title/excerpt/keywords）。 */
  matchedFields: string[];
}

/** 字段权重：标题最高，其次摘要，再次关键词。 */
const FIELD_BOOST: Record<string, number> = {
  title: 4,
  keywords: 2,
  excerpt: 1,
};

/**
 * MiniSearch 选项。`storeFields` 让结果直接带回展示所需字段，
 * 无需再回源。`fuzzy`/`prefix` 提供拼写容错与前缀匹配。
 */
export const MINISEARCH_OPTIONS: Options<SearchDoc> = {
  idField: 'id',
  fields: ['title', 'excerpt', 'keywords'],
  storeFields: ['type', 'refId', 'slug', 'title', 'excerpt', 'keywords', 'date', 'readTime'],
  // 大小写无关 + 去除常见标点，让 "next.js" / "nextjs" / "Next JS" 可互相匹配。
  processTerm: (term) => term.toLowerCase().replace(/[._/\-]/g, '') || null,
  searchOptions: {
    boost: FIELD_BOOST,
    prefix: true,
    // 词越长容许的编辑距离越大；短词不做模糊以免噪声。
    fuzzy: (term) => (term.length <= 3 ? false : 0.2),
    combineWith: 'AND',
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

/** 执行查询并归一化为 SearchHit[]。空查询返回 []。 */
export function runSearch(mini: MiniSearch<SearchDoc>, query: string, limit = 20): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const raw = mini.search(q) as Array<MiniSearchResult & Partial<SearchDoc>>;
  return raw.slice(0, limit).map((r) => ({
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
  }));
}

/**
 * 在纯文本里按查询词高亮，返回带 `<mark>` 的安全 HTML 片段。
 * 仅转义文本、仅注入 `<mark>`，避免 XSS。可选裁剪到命中词附近形成片段。
 */
export function highlight(text: string, query: string, snippetRadius?: number): string {
  if (!text) return '';
  const terms = Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/\s+/)
        .map((t) => t.replace(/[._/\-]/g, ''))
        .filter((t) => t.length >= 2),
    ),
  );

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
      .map((t) => lower.indexOf(t))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b)[0];
    if (firstIdx !== undefined && firstIdx > snippetRadius) {
      const start = Math.max(0, firstIdx - snippetRadius);
      working = (start > 0 ? '…' : '') + text.slice(start, firstIdx + snippetRadius * 2);
    } else {
      working = text.slice(0, snippetRadius * 3);
    }
  }

  const pattern = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi',
  );
  // 先转义，再在转义后的文本上做高亮（命中词不含特殊 HTML 字符，安全）。
  return escape(working).replace(pattern, '<mark>$1</mark>');
}

/** 把 locale 映射为 Notion `Language` 字段使用的名称。 */
export function localeToLanguage(locale: Locale): 'English' | 'Chinese' {
  return locale === 'zh' ? 'Chinese' : 'English';
}

/** 命令面板 / 搜索页共享的本地化文案（项目实际未挂载 NextIntlClientProvider，沿用 locale 文案对象模式）。 */
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
  },
} as const;

export const popularSearches: Record<Locale, string[]> = {
  en: ['Next.js', 'TypeScript', 'React', 'AI', 'Machine Learning', 'Notion'],
  zh: ['Next.js', 'TypeScript', 'React', 'AI', '人工智能', 'Notion'],
};
