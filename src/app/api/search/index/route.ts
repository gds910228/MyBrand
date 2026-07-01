import { NextResponse } from 'next/server';
import { getSearchDocuments } from '@/services/searchData';
import { locales, type Locale } from '@/i18n/locales';

/**
 * 站内搜索索引下发。
 *
 * GET /api/search/index?locale=en|zh
 * 返回该语言下的精简文档集，客户端用 MiniSearch 在浏览器内做模糊/前缀搜索。
 * 用 ISR 缓存（10 分钟），避免每次打开命令面板都回源 Notion。
 */
export const revalidate = 600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = (searchParams.get('locale') || 'en') as Locale;
  const locale: Locale = locales.includes(localeParam) ? localeParam : 'en';

  try {
    const documents = await getSearchDocuments(locale);
    return NextResponse.json(
      { locale, count: documents.length, documents },
      {
        headers: {
          // 与 ISR 协同：浏览器/CDN 也可短期缓存。
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
        },
      },
    );
  } catch (error) {
    console.error('[API] search index build error:', error);
    // 优雅降级：返回空索引而非 500，客户端命令面板仍可打开（显示空态）。
    return NextResponse.json({ locale, count: 0, documents: [] }, { status: 200 });
  }
}
