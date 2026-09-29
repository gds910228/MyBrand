import SearchPageClient from '@/components/SearchPageClient';
import { loadSearchPageData } from '@/services/searchService';

/**
 * 搜索页（ZH）——与 EN 版**结构完全对应**（feat-search-discovery-20260928，能力块 G）。
 *
 * 与 `src/app/search/page.tsx` 的唯一差异是 `locale="zh"`：
 * 它决定 ① 检索哪一套语言的索引；② 界面文案语言。其余逻辑共用同一服务端装载函数
 * `loadSearchPageData`，保证两套页面口径一致。
 *
 * URL 即状态：q / type / tag / sort / from / to / page 全部由 URL 驱动，SSR 直出。
 * 原实现只读取 `?q=` 且服务端固定 limit 20，无法分享筛选状态——本次一并修正。
 */
export const dynamic = 'force-dynamic';

export default async function SearchPageZh({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { params, data, tags, paramError } = await loadSearchPageData('zh', searchParams);

  return (
    <SearchPageClient
      locale="zh"
      params={params}
      data={data}
      tags={tags}
      paramError={paramError}
    />
  );
}
