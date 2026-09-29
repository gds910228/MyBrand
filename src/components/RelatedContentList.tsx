import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faFolder, faTags, faClock } from '@fortawesome/free-solid-svg-icons';
import type { Locale } from '@/i18n/locales';
import type { RelatedItem } from '@/types/search';

/**
 * 相关内容推荐的**展示层**（客户端组件）。
 *
 * 为什么拆成两层（与仓库既有 `RelatedPosts` → `BlogCard` 的模式一致）：
 * 数据获取必须在服务端完成（能力块 F：SSR、杜绝整库客户端拉取），
 * 而图标 / 交互属于客户端职责。`SmartRecommendations` 是服务端组件，
 * 负责取数后把结果传进来渲染。
 */
export default function RelatedContentList({
  items,
  locale,
  title,
}: {
  items: RelatedItem[];
  locale: Locale;
  title: string;
}) {
  const prefix = locale === 'zh' ? '/zh' : '';

  if (items.length === 0) return null;

  return (
    <div className="py-8" data-testid="related-content">
      <h3 className="text-lg font-semibold text-neutral-darker dark:text-dark-neutral-darker mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faTags} className="w-4 h-4 text-primary" />
        {title}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            data-related-id={item.id}
            className="p-4 rounded-lg glass-surface border border-white/20 dark:border-white/10 hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <FontAwesomeIcon
                  icon={item.type === 'blog' ? faFileAlt : faFolder}
                  className="w-4 h-4 text-primary"
                />
              </div>

              <div className="flex-1 min-w-0">
                <Link
                  href={`${prefix}/${item.type === 'blog' ? 'blog' : 'projects'}/${item.slug}`}
                  className="font-medium text-neutral-darker dark:text-dark-neutral-darker hover:text-primary dark:hover:text-dark-primary transition-colors line-clamp-2"
                >
                  {item.title}
                </Link>

                {item.excerpt && (
                  <p className="text-sm text-neutral-dark dark:text-dark-neutral-dark mt-1 mb-2 line-clamp-2">
                    {item.excerpt}
                  </p>
                )}

                {/* 推荐理由（验收项 S22）：来自共享标签或同类型判定 */}
                <p className="text-xs text-primary dark:text-dark-primary mb-1">{item.reason}</p>

                {item.date && (
                  <div className="flex items-center gap-1 text-xs text-neutral-dark/60 dark:text-dark-neutral-dark/60">
                    <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                    <span>{new Date(item.date).toLocaleDateString(locale === 'zh' ? 'zh-CN' : undefined)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
