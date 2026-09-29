import SearchPageClient from '@/components/SearchPageClient';
import { loadSearchPageData } from '@/services/searchService';

/**
 * 搜索页（EN）——**URL 即状态**（feat-search-discovery-20260928，能力块 G）。
 *
 * 查询与筛选状态全部来自 URL query（q / type / tag / sort / from / to / page），
 * 服务端据此检索并**直出结果**，因此：
 * - 刷新保持结果；分享 URL 即分享搜索结果；浏览器回退保持筛选状态；
 * - 无 JS 时表单 `method="get"` 提交回本页，SSR 依旧给出正确结果。
 *
 * 参数非法（type/sort/日期畸形）**不报错**：返回空结果 + 提示文案，页面仍 200。
 */
export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { params, data, tags, paramError } = await loadSearchPageData('en', searchParams);

  return (
    <SearchPageClient
      locale="en"
      params={params}
      data={data}
      tags={tags}
      paramError={paramError}
    />
  );
}
