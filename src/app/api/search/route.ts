import { NextRequest, NextResponse } from 'next/server';
import { safeJson } from '@/lib/safeJson';
import { parseSearchQuery } from '@/lib/searchQuery';
import { SEARCH_RATE_LIMIT, getClientIp, rateLimited } from '@/lib/rateLimit';
import { searchContent } from '@/services/searchService';
import { createSearchEvent } from '@/lib/searchAnalytics';
import { recordEvent } from '@/lib/searchEventStore';
import type { SearchResponse } from '@/types/search';

/**
 * 服务端搜索 API（feat-search-discovery-20260928，能力块 B/C/E）。
 *
 * GET /api/search
 *   ?q=<freetext>            自由文本
 *   &type=blog|project       内容类型过滤（非法值 → 400）
 *   &tag=<tag>               标签过滤（大小写不敏感精确匹配）
 *   &from=YYYY-MM-DD         起始日期（含边界；非法 → 400）
 *   &to=YYYY-MM-DD           结束日期（含边界；非法 → 400）
 *   &locale=en|zh            索引语言（兼容旧参数 ?language=English|Chinese）
 *   &sort=relevance|newest   排序（非法值 → 400）
 *   &page=<int≥1>            页码（畸形/越界 → clamp 或空集，不报错）
 *   &pageSize=<int 1..50>    每页条数（超范围 → clamp，不报错）
 *
 * 容错约定（spec §2B）：结构性参数非法 → 400；数值/分页越界 → 空集或 clamp。
 * **任何情况下都不返回 500**，除非服务层真的抛异常（此时按规范 500 + console.error）。
 *
 * 与客户端命令面板口径一致：两者共用 `src/lib/searchIndex.ts` 的同一套分词与
 * `src/lib/searchRanking.ts` 的同一套排序（验收项 S18）。
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // --- 限流（独立命名桶，与评论/订阅互不干扰）---
    const ip = getClientIp(request);
    if (
      rateLimited(ip, {
        bucket: SEARCH_RATE_LIMIT.bucket,
        max: SEARCH_RATE_LIMIT.max,
        windowMs: SEARCH_RATE_LIMIT.windowMs,
      })
    ) {
      return safeJson({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);

    // --- 参数解析：结构性错误一律 400，绝不 500 ---
    const parsed = parseSearchQuery(searchParams);
    if (!parsed.ok || !parsed.params) {
      return safeJson({ error: parsed.error || 'Invalid query' }, { status: 400 });
    }
    const params = parsed.params;

    const outcome = await searchContent(params);

    // --- 搜索行为分析：fire-and-forget，绝不阻塞、绝不影响主查询 ---
    // 仅在非空查询时记录，避免空查询污染热门词统计。
    if (params.q) {
      try {
        recordEvent(
          createSearchEvent({
            query: params.q,
            locale: params.locale,
            resultCount: outcome.total,
            type: params.type,
            tag: params.tag,
            sort: params.sort,
          }),
        );
      } catch (analyticsError) {
        // 分析是旁路能力，失败只告警，不影响响应。
        console.warn('[API] search analytics record failed:', analyticsError);
      }
    }

    const body: SearchResponse = {
      results: outcome.items,
      // 兼容旧字段：count 为「本页条数」，语义与改造前一致（改造前无分页，count == 结果数）。
      count: outcome.items.length,
      query: params.q,
      total: outcome.total,
      page: outcome.page,
      pageSize: outcome.pageSize,
      totalPages: outcome.totalPages,
      sort: params.sort,
      filters: {
        type: params.type,
        tag: params.tag,
        from: params.from,
        to: params.to,
      },
      tookMs: outcome.tookMs,
    };

    return safeJson(body);
  } catch (error) {
    // 内部细节只进服务端日志，不回给客户端（评审 P2-7：避免内部信息泄露）。
    console.error('[API] Search error:', error);
    return safeJson({ error: 'Search failed' }, { status: 500 });
  }
}
