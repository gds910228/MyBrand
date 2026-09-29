/**
 * 搜索行为分析：事件模型、脱敏与聚合（feat-search-discovery-20260928，T13；能力块 E）。
 *
 * 纯函数模块（存储见 `src/lib/searchEventStore.ts`），所有聚合结果确定可复现。
 *
 * **隐私边界（硬性）**：事件**只**包含查询词与聚合所需的维度。
 * 明确**不采集**：IP、User-Agent、Cookie、会话标识、任何可关联到个人的字段。
 * 查询词会截断到 100 字符并去除控制字符，避免超长/畸形输入污染存储。
 */
import type { Locale } from '@/i18n/locales';
import type { SearchAnalyticsSummary } from '@/types/search';

/** 单条搜索事件（已脱敏）。 */
export interface SearchEvent {
  /** 已脱敏的查询词。 */
  query: string;
  locale: Locale;
  /** 本次查询命中的结果数（0 = 零结果词）。 */
  resultCount: number;
  /** 事件时间戳（ms）。 */
  timestamp: number;
  /** 过滤维度（用于后续细分分析，当前仅存储）。 */
  type: string | null;
  tag: string | null;
  sort: string;
}

/** 查询词最大存储长度。 */
export const MAX_QUERY_STORE_LENGTH = 100;

/**
 * 脱敏查询词：
 * - 去除 C0/C1 控制字符（含换行、制表，防止日志注入）；
 * - 折叠连续空白；
 * - 截断到 MAX_QUERY_STORE_LENGTH。
 */
export function sanitizeQuery(raw: string): string {
  if (!raw) return '';
  return raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_STORE_LENGTH);
}

/** 由原始请求参数构造一条脱敏事件。 */
export function createSearchEvent(input: {
  query: string;
  locale: Locale;
  resultCount: number;
  timestamp?: number;
  type?: string | null;
  tag?: string | null;
  sort?: string;
}): SearchEvent {
  return {
    query: sanitizeQuery(input.query),
    locale: input.locale,
    resultCount: Number.isFinite(input.resultCount) ? input.resultCount : 0,
    timestamp: input.timestamp ?? Date.now(),
    type: input.type ?? null,
    tag: input.tag ?? null,
    sort: input.sort ?? 'relevance',
  };
}

/** 热门词条目。 */
export interface QueryCount {
  query: string;
  count: number;
  /** 该词产生零结果的次数。 */
  zeroResultCount: number;
}

/**
 * 按查询词聚合：次数 / 零结果次数 / 去重词数。
 * 空词事件（脱敏后为空串）被忽略。
 */
export function countQueries(events: SearchEvent[]): Map<string, { count: number; zero: number }> {
  const map = new Map<string, { count: number; zero: number }>();
  for (const e of events) {
    // trim 后再判空：调用方可能未走 sanitizeQuery（例如直接构造事件），
    // 纯空白查询不应计入热门词。
    if (!e.query || !e.query.trim()) continue;
    const rec = map.get(e.query) || { count: 0, zero: 0 };
    rec.count += 1;
    if (e.resultCount === 0) rec.zero += 1;
    map.set(e.query, rec);
  }
  return map;
}

/**
 * 确定性排序：次数降序 → 词条字典序升序。
 * 第二步是必要的——否则同频词在不同 V8 版本/插入顺序下顺序不稳定，
 * S14/S15 的断言会变成 flaky。
 */
function toSortedList(entries: Array<[string, { count: number; zero: number }]>): QueryCount[] {
  return entries
    .map(([query, v]) => ({ query, count: v.count, zeroResultCount: v.zero }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.query < b.query ? -1 : a.query > b.query ? 1 : 0;
    });
}

/** 聚合搜索事件，产出 admin 分析视图所需的摘要。 */
export function aggregateSearchEvents(events: SearchEvent[]): SearchAnalyticsSummary {
  const counts = countQueries(events);
  const entries = Array.from(counts.entries());

  const topQueries = toSortedList(entries);

  const zeroResultQueries = entries
    .filter(([, v]) => v.zero > 0)
    .map(([query, v]) => ({ query, count: v.zero }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.query < b.query ? -1 : a.query > b.query ? 1 : 0;
    });

  return {
    totalSearches: events.filter((e) => !!e.query && !!e.query.trim()).length,
    uniqueQueries: counts.size,
    topQueries,
    zeroResultQueries,
  };
}
