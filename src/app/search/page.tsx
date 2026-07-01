import SearchPageClient from '@/components/SearchPageClient';
import { getSearchDocuments } from '@/services/searchData';
import { createSearchIndex, runSearch, type SearchHit } from '@/lib/searchIndex';

/**
 * 搜索页（EN）。服务端组件：读取 ?q= 并预渲染结果，
 * 提供无 JS / 首屏兜底；客户端再由 SearchPageClient 接管即时搜索。
 */
export const revalidate = 600;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams?.q || '').trim();
  let initialHits: SearchHit[] = [];

  if (q) {
    try {
      const docs = await getSearchDocuments('en');
      initialHits = runSearch(createSearchIndex(docs), q, 20);
    } catch (error) {
      console.error('[SearchPage] server fallback search failed:', error);
    }
  }

  return <SearchPageClient locale="en" initialQuery={q} initialHits={initialHits} />;
}
