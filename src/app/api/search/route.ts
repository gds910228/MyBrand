import { NextResponse } from 'next/server';
import { getSearchDocuments } from '@/services/searchData';
import { createSearchIndex, runSearch } from '@/lib/searchIndex';
import { locales, type Locale } from '@/i18n/locales';

/**
 * 服务端兜底搜索。
 *
 * GET /api/search?q=...&locale=en|zh   （兼容旧参数 ?language=English|Chinese）
 *
 * 作用：
 * - 供 /search 页在禁用 JS / 首屏 SSR 时返回结果（命令面板走客户端 /api/search/index）。
 * - 与客户端共用 src/lib/searchIndex 的同一套 MiniSearch 配置，口径一致。
 *
 * 相比旧实现，移除了「对前 10 篇博客逐篇 getBlogPostById 拉全文」的 N+1 逻辑，
 * 改为对列表元数据建一次内存索引后检索，请求数显著下降、有相关性排序与拼写容错。
 */
export const revalidate = 600;

function resolveLocale(searchParams: URLSearchParams): Locale {
  const localeParam = searchParams.get('locale') as Locale | null;
  if (localeParam && locales.includes(localeParam)) return localeParam;
  // 兼容旧的 language=English|Chinese
  const language = searchParams.get('language');
  if (language === 'Chinese') return 'zh';
  return 'en';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const locale = resolveLocale(searchParams);

  if (!query?.trim()) {
    return NextResponse.json({ results: [], count: 0, query: '' });
  }

  try {
    const documents = await getSearchDocuments(locale);
    const index = createSearchIndex(documents);
    const hits = runSearch(index, query, 20);

    // 兼容旧响应形状：保留 results/count/query，字段补齐前端已用的键。
    const results = hits.map((h) => ({
      id: h.refId,
      slug: h.slug,
      title: h.title,
      excerpt: h.excerpt,
      type: h.type,
      date: h.date,
      score: h.score,
      ...(h.type === 'blog'
        ? { tags: h.keywords, readTime: h.readTime }
        : { technologies: h.keywords }),
    }));

    return NextResponse.json({ results, count: results.length, query });
  } catch (error) {
    console.error('[API] Search error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Search failed', message }, { status: 500 });
  }
}
