/**
 * 搜索查询参数解析、过滤与分页（feat-search-discovery-20260928，T07；能力块 B）。
 *
 * 设计原则（spec §2B）：
 * - **非法输入一律容错，绝不 500**：结构性参数错误（type/sort/from/to）返回 400；
 *   数值型参数（page/pageSize）越界或畸形一律 clamp 或返回空集，不报错。
 * - 分页越界（page > totalPages）返回**空集**而非错误。
 * - 纯函数模块：不碰网络、不依赖 Next.js，所有边界均可单测。
 */
import { locales, type Locale } from '@/i18n/locales';
import { MAX_QUERY_LENGTH, normalizeQuery, type SearchDoc, type SearchDocType } from '@/lib/searchIndex';
import type { SortMode } from '@/lib/searchRanking';
import type { ParsedSearchQuery, ParseSearchQueryResult } from '@/types/search';

export { MAX_QUERY_LENGTH };

/** 默认每页条数（沿用改造前服务端硬编码的 20）。 */
export const DEFAULT_PAGE_SIZE = 20;
/** 每页上限：超出直接 clamp，不报错（防大页拖垮响应）。 */
export const MAX_PAGE_SIZE = 50;

const VALID_TYPES: SearchDocType[] = ['blog', 'project'];
const VALID_SORTS: SortMode[] = ['relevance', 'newest'];

/** 可被解析的查询串来源：URLSearchParams 或 Next.js 的 searchParams 对象。 */
export type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

/** 取值：兼容 URLSearchParams 与 Next 的 searchParams 对象；数组取第一个。 */
function readParam(input: SearchParamsInput, key: string): string | null {
  if (input instanceof URLSearchParams) return input.get(key);
  const raw = input[key];
  if (raw === undefined || raw === null) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

/** `YYYY-MM-DD` 严格校验：格式 + 真实存在的日期（拒绝 2024-02-31）。 */
export function isValidDateParam(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** 日期（含边界）→ 当日 00:00:00.000 UTC 毫秒。 */
export function dayStartMs(value: string): number {
  const [y, m, d] = value.split('-').map(Number);
  return Date.UTC(y, m - 1, d, 0, 0, 0, 0);
}

/** 日期（含边界）→ 当日 23:59:59.999 UTC 毫秒。 */
export function dayEndMs(value: string): number {
  const [y, m, d] = value.split('-').map(Number);
  return Date.UTC(y, m - 1, d, 23, 59, 59, 999);
}

/**
 * 解析并归一化搜索参数。
 *
 * 兼容性：`locale` 非法或缺省 → 默认 `en`；同时兼容旧参数 `language=Chinese|English`。
 */
export function parseSearchQuery(input: SearchParamsInput): ParseSearchQueryResult {
  const rawType = readParam(input, 'type');
  const rawSort = readParam(input, 'sort');
  const rawFrom = readParam(input, 'from');
  const rawTo = readParam(input, 'to');

  // --- 结构性参数：非法即 400 ---
  let type: SearchDocType | null = null;
  if (rawType !== null && rawType !== '') {
    if (!VALID_TYPES.includes(rawType as SearchDocType)) {
      return { ok: false, error: `Invalid type: expected one of ${VALID_TYPES.join(', ')}` };
    }
    type = rawType as SearchDocType;
  }

  let sort: SortMode = 'relevance';
  if (rawSort !== null && rawSort !== '') {
    if (!VALID_SORTS.includes(rawSort as SortMode)) {
      return { ok: false, error: `Invalid sort: expected one of ${VALID_SORTS.join(', ')}` };
    }
    sort = rawSort as SortMode;
  }

  let from: string | null = null;
  if (rawFrom !== null && rawFrom !== '') {
    if (!isValidDateParam(rawFrom)) {
      return { ok: false, error: 'Invalid from: expected YYYY-MM-DD' };
    }
    from = rawFrom;
  }

  let to: string | null = null;
  if (rawTo !== null && rawTo !== '') {
    if (!isValidDateParam(rawTo)) {
      return { ok: false, error: 'Invalid to: expected YYYY-MM-DD' };
    }
    to = rawTo;
  }

  // --- 语言：非法值回落默认，不报错（保持旧行为） ---
  const rawLocale = readParam(input, 'locale');
  let locale: Locale = 'en';
  if (rawLocale && (locales as readonly string[]).includes(rawLocale)) {
    locale = rawLocale as Locale;
  } else {
    // 兼容旧参数 language=English|Chinese
    const legacy = readParam(input, 'language');
    if (legacy === 'Chinese') locale = 'zh';
    else if (legacy === 'English') locale = 'en';
  }

  // --- 数值参数：畸形/越界一律 clamp，不报错 ---
  const pageSize = clampPageSize(readParam(input, 'pageSize'));
  const page = clampPage(readParam(input, 'page'));

  const rawTag = readParam(input, 'tag');
  const tag = rawTag && rawTag.trim() ? rawTag.trim() : null;

  return {
    ok: true,
    params: {
      q: normalizeQuery(readParam(input, 'q') || ''),
      type,
      tag,
      from,
      to,
      locale,
      sort,
      page,
      pageSize,
    },
  };
}

/** pageSize：默认 20；非法或 <1 → 默认；>50 → clamp 到 50。 */
export function clampPageSize(raw: string | null): number {
  if (raw === null || raw.trim() === '') return DEFAULT_PAGE_SIZE;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(n, MAX_PAGE_SIZE);
}

/** page：默认 1；非法或 <1 → 1。越界（> 总页数）由分页层返回空集。 */
export function clampPage(raw: string | null): number {
  if (raw === null || raw.trim() === '') return 1;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return 1;
  return n;
}

/** 标签匹配：大小写不敏感的精确匹配（对应 S6「结果 keywords 均含该标签」）。 */
export function hasTag(doc: SearchDoc, tag: string): boolean {
  const needle = tag.trim().toLowerCase();
  if (!needle) return true;
  return (doc.keywords || []).some((k) => String(k).trim().toLowerCase() === needle);
}

/**
 * 单文档过滤判定：类型 / 标签 / 时间范围。
 * 日期过滤为**含边界**：`from` 当日 00:00:00 起，`to` 当日 23:59:59.999 止。
 * 日期缺失或非法的文档在指定了时间范围时被排除（无法证明其落在区间内）。
 */
export function matchesFilters(doc: SearchDoc, params: ParsedSearchQuery): boolean {
  if (params.type && doc.type !== params.type) return false;
  if (params.tag && !hasTag(doc, params.tag)) return false;

  const fromMs = params.from ? dayStartMs(params.from) : null;
  const toMs = params.to ? dayEndMs(params.to) : null;

  if (fromMs !== null || toMs !== null) {
    const ms = new Date(doc.date).getTime();
    if (!Number.isFinite(ms) || ms === 0) return false;
    if (fromMs !== null && ms < fromMs) return false;
    if (toMs !== null && ms > toMs) return false;
  }

  return true;
}

/** 按结构化条件批量过滤文档。 */
export function filterDocs(docs: SearchDoc[], params: ParsedSearchQuery): SearchDoc[] {
  return docs.filter((doc) => matchesFilters(doc, params));
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 分页切片。
 * - `page > totalPages` → **空集**（不报错，对应 S11）。
 * - 总数为 0 时 `totalPages = 0`、`items = []`。
 */
export function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length;
  const size = Math.max(1, pageSize);
  const totalPages = Math.ceil(total / size);
  const safePage = Math.max(1, page);

  if (safePage > totalPages) {
    return { items: [], total, page: safePage, pageSize: size, totalPages };
  }

  const start = (safePage - 1) * size;
  return {
    items: items.slice(start, start + size),
    total,
    page: safePage,
    pageSize: size,
    totalPages,
  };
}
