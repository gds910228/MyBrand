import { NextRequest, NextResponse } from 'next/server';
import { safeJson } from '@/lib/safeJson';
import { checkAdminAccess } from '@/lib/adminAuth';
import { aggregateSearchEvents } from '@/lib/searchAnalytics';
import { listEvents } from '@/lib/searchEventStore';
import { ANALYTICS_RATE_LIMIT, getClientIp, rateLimited } from '@/lib/rateLimit';

/**
 * 搜索分析读取端点（feat-search-discovery-20260928，T14；能力块 E）。
 *
 * GET /api/admin/search-analytics?limit=<n>
 *
 * 鉴权**完全复用** `checkAdminAccess`，与 `/api/admin/comments` 的行为一致：
 * - `ADMIN_TOKEN` 已配置 → 必须携带匹配的 `Authorization: Bearer <token>`，否则 401；
 * - `ADMIN_TOKEN` 未配置 → 仅 Host 为 localhost/127.0.0.1/[::1] 放行，其它 host 403。
 *
 * 返回聚合后的热门词与零结果词（确定性排序：次数降序 → 词条字典序）。
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 默认返回的热门词条数。 */
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: NextRequest) {
  try {
    const access = checkAdminAccess(request);
    if (!access.allowed) {
      return safeJson({ ok: false, error: access.error }, { status: access.status });
    }

    const ip = getClientIp(request);
    if (
      rateLimited(ip, {
        bucket: ANALYTICS_RATE_LIMIT.bucket,
        max: ANALYTICS_RATE_LIMIT.max,
        windowMs: ANALYTICS_RATE_LIMIT.windowMs,
      })
    ) {
      return safeJson({ ok: false, error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const limitRaw = Number(searchParams.get('limit'));
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(Math.floor(limitRaw), MAX_LIMIT)
        : DEFAULT_LIMIT;

    const events = listEvents();
    const summary = aggregateSearchEvents(events);

    return safeJson({
      ok: true,
      totalSearches: summary.totalSearches,
      uniqueQueries: summary.uniqueQueries,
      // 分析存储为进程内内存（见 searchEventStore 注释）：多实例下各实例独立计数。
      storage: 'memory',
      sampledEvents: events.length,
      topQueries: summary.topQueries.slice(0, limit),
      zeroResultQueries: summary.zeroResultQueries.slice(0, limit),
    });
  } catch (error) {
    console.error('[admin/search-analytics GET] Error:', error);
    return safeJson(
      { ok: false, error: 'Failed to load search analytics' },
      { status: 500 },
    );
  }
}
