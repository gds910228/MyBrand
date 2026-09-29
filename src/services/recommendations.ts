/**
 * 相关内容推荐服务（feat-search-discovery-20260928，T15；能力块 F）。
 *
 * 与改造前 `SmartRecommendations` 的本质区别：
 * - 改造前：**客户端**组件，`useEffect` 内整库拉取全部博客 + 全部项目，语言硬编码 `'English'`，
 *   并从 URL 路径片段提取「伪关键词」做匹配——与搜索索引口径完全脱节。
 * - 现在：**服务端**函数，复用 `getIndexDocs()`（与检索层同一个进程内缓存索引，
 *   零额外 Notion 往返），语言由 `locale` 驱动，评分复用 `searchRanking.scoreRelated`。
 *
 * 排序规则（同类型优先 + 标签相似度 + 时效弱加权，最终以 id 兜底确定性）见 `rankRelated`。
 */
import { getIndexDocs } from '@/services/searchService';
import { rankRelated, rankingReferenceTime } from '@/lib/searchRanking';
import { searchTexts, type SearchDoc, type SearchDocType } from '@/lib/searchIndex';
import type { Locale } from '@/i18n/locales';
import type { RelatedItem } from '@/types/search';

export interface RelatedQuery {
  /** 当前内容类型。 */
  type: SearchDocType;
  /** 当前内容 id：blog 为 Notion page id / 本地种子 id；project 同理。 */
  id: string;
  /** 当前内容的标签（blog tags / project technologies）。 */
  keywords: string[];
  locale: Locale;
  limit?: number;
  /** 排序基准时间，默认按小时取整（与检索层一致，保证可复现）。 */
  now?: number;
}

/** 组装「当前文档」的评分视图（只需 id/type/keywords/date）。 */
export function buildCurrentDoc(input: RelatedQuery): SearchDoc {
  return {
    id: `${input.type}:${input.id}`,
    type: input.type,
    refId: input.id,
    slug: '',
    title: '',
    excerpt: '',
    keywords: input.keywords || [],
    date: '',
  };
}

/** 把推荐理由本地化：优先展示共享标签，否则回落到「同类内容」。 */
function buildReason(sharedTags: string[], sameType: boolean, locale: Locale): string {
  const t = searchTexts[locale];
  if (sharedTags.length > 0) return t.relatedReasonTags(sharedTags.slice(0, 3).join(', '));
  if (sameType) return t.relatedReasonSameType;
  return t.relatedReasonTopic;
}

/**
 * 取相关内容推荐。
 *
 * **同类型优先**的实现方式：默认只推荐同类型内容（blog→blog、project→project）。
 * 若同类型结果不足 `limit`，再用跨类型结果补齐——这样既保证「同类优先」的观感，
 * 又不会在内容稀疏时出现空推荐位。
 */
export async function getRelatedContent(input: RelatedQuery): Promise<RelatedItem[]> {
  const limit = input.limit ?? 4;
  const now = input.now ?? rankingReferenceTime();

  const docs = await getIndexDocs(input.locale);
  const current = buildCurrentDoc(input);

  const sameType = rankRelated(current, docs, now, limit, true);
  let picked = sameType;

  if (picked.length < limit) {
    const crossType = rankRelated(current, docs, now, limit * 2, false);
    const seen = new Set(picked.map((p) => p.id));
    for (const item of crossType) {
      if (picked.length >= limit) break;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      picked = [...picked, item];
    }
  }

  return picked.map((hit) => ({
    id: hit.id,
    refId: hit.refId,
    slug: hit.slug,
    title: hit.title,
    excerpt: hit.excerpt,
    type: hit.type,
    date: hit.date,
    keywords: hit.keywords,
    score: hit.score,
    sharedTags: hit.sharedTags,
    sameType: hit.sameType,
    reason: buildReason(hit.sharedTags, hit.sameType, input.locale),
  }));
}
