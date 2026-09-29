import React from 'react';
import RelatedContentList from '@/components/RelatedContentList';
import { getRelatedContent } from '@/services/recommendations';
import { searchTexts, type SearchDocType } from '@/lib/searchIndex';
import type { Locale } from '@/i18n/locales';

/**
 * 相关内容推荐（feat-search-discovery-20260928，T15；能力块 F）。
 *
 * **本组件是服务端组件**（async，无 'use client'）：
 * - 数据在服务端取（`getRelatedContent`），SSR 直出，首屏即有内容，无需客户端拉取；
 * - 复用检索层的**同一个进程内缓存索引**（`getIndexDocs`），零额外 Notion 往返；
 * - 语言由 `locale` 驱动（改造前硬编码 `'English'`）；
 * - 排序与检索层共用 `src/lib/searchRanking.ts`（同类型优先 + 标签相似度 + 确定性兜底）。
 *
 * 展示交给客户端组件 `RelatedContentList`（与仓库既有 RelatedPosts → BlogCard 模式一致）。
 *
 * 挂载点：blog 详情 EN/ZH + project 详情 EN/ZH 共四处（见 tasks T17）。
 */
export interface SmartRecommendationsProps {
  /** 当前内容类型。 */
  type: SearchDocType;
  /** 当前内容 id（Notion page id 或本地种子 id）。 */
  id: string;
  /** 当前内容的标签（blog tags / project technologies）。 */
  keywords: string[];
  locale: Locale;
  /** 最多展示条数，默认 4。 */
  maxItems?: number;
}

export default async function SmartRecommendations({
  type,
  id,
  keywords,
  locale,
  maxItems = 4,
}: SmartRecommendationsProps) {
  const items = await getRelatedContent({
    type,
    id,
    keywords: Array.isArray(keywords) ? keywords : [],
    locale,
    limit: maxItems,
  });

  const title = searchTexts[locale].relatedTitle;

  // 无推荐（内容极少或标签为空）时不渲染空区块，避免详情页出现孤立标题。
  if (items.length === 0) return null;

  return <RelatedContentList items={items} locale={locale} title={title} />;
}
