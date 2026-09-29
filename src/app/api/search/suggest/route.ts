import { NextRequest, NextResponse } from 'next/server';
import { safeJson } from '@/lib/safeJson';
import { locales, type Locale } from '@/i18n/locales';
import { getIndexDocs } from '@/services/searchService';
import { buildSuggestions, DEFAULT_SUGGEST_LIMIT, MAX_SUGGEST_LIMIT } from '@/lib/searchSuggest';
import { popularSearches } from '@/lib/searchIndex';
import { SUGGEST_RATE_LIMIT, getClientIp, rateLimited } from '@/lib/rateLimit';
import type { SuggestResponse } from '@/types/search';

/**
 * 搜索建议端点（feat-search-discovery-20260928，T12；能力块 D）。
 *
 * GET /api/search/suggest?prefix=<str>&locale=en|zh&limit=<1..20>
 *
 * 建议词**来自当前索引内容**（文档标题与标签/技术栈），替代改造前写死的静态数组；
 * 索引为空或前缀为空时回落静态热门词（`source: 'fallback'`）。
 *
 * 与其他路由一致：参数非法一律容错（clamp / 空结果），绝不 500。
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    // 建议端点使用**独立**的宽松桶：输入框每次防抖都会请求建议，
    // 若与真实搜索共用 search 桶，会把用户的搜索请求挤出配额（评审 P2-4）。
    if (
      rateLimited(ip, {
        bucket: SUGGEST_RATE_LIMIT.bucket,
        max: SUGGEST_RATE_LIMIT.max,
        windowMs: SUGGEST_RATE_LIMIT.windowMs,
      })
    ) {
      return safeJson({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);

    const prefix = (searchParams.get('prefix') || '').trim().slice(0, 100);

    const localeParam = searchParams.get('locale') || 'en';
    const locale: Locale = (locales as readonly string[]).includes(localeParam)
      ? (localeParam as Locale)
      : 'en';

    const limitRaw = Number(searchParams.get('limit'));
    const limit = Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.floor(limitRaw), MAX_SUGGEST_LIMIT)
      : DEFAULT_SUGGEST_LIMIT;

    // 空前缀：直接返回静态热门词兜底，不构建索引。
    if (!prefix) {
      const body: SuggestResponse = {
        prefix: '',
        locale,
        suggestions: popularSearches[locale].map((text) => ({ text, count: 0 })),
        source: 'fallback',
      };
      return safeJson(body);
    }

    // 索引读取失败（如上游异常）时也回落静态兜底，不把错误抛给用户。
    let docs: Awaited<ReturnType<typeof getIndexDocs>> = [];
    try {
      docs = await getIndexDocs(locale);
    } catch (indexError) {
      console.warn('[API] suggest index unavailable, falling back to static list:', indexError);
    }

    const suggestions = buildSuggestions(prefix, docs, limit);

    const body: SuggestResponse = {
      prefix,
      locale,
      suggestions,
      source: suggestions.length > 0 ? 'index' : 'fallback',
    };

    // 索引有内容但前缀无匹配时，用静态热门词兜底，避免用户看到空下拉。
    if (suggestions.length === 0) {
      body.suggestions = popularSearches[locale]
        .filter((term) => term.toLowerCase().startsWith(prefix.toLowerCase()))
        .slice(0, limit)
        .map((text) => ({ text, count: 0 }));
    }

    return safeJson(body);
  } catch (error) {
    console.error('[API] suggest error:', error);
    // 建议是增强能力：即使失败也返回可用的空结构而非 500，前端无需特判。
    return safeJson(
      { prefix: '', locale: 'en', suggestions: [], source: 'fallback' },
      { status: 200 },
    );
  }
}
