import React from 'react';

export interface BlogCardSkeletonProps {
  view?: 'grid' | 'list';
}

const BlogCardSkeleton: React.FC<BlogCardSkeletonProps> = ({ view = 'grid' }) => {
  if (view === 'list') {
    // 列表视图骨架屏
    return (
      <div className="group flex gap-4 p-4 rounded-lg glass-surface border border-white/20 dark:border-white/10 animate-pulse">
        <div className="relative w-40 h-24 flex-shrink-0 overflow-hidden rounded-md bg-neutral-300 dark:bg-neutral-700" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-5 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-full" />
            <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-2/3" />
          </div>
          <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-1/3" />
        </div>
      </div>
    );
  }

  // 网格视图骨架屏
  return (
    <div className="glass-surface rounded-xl shadow-lg overflow-hidden h-full flex flex-col border border-white/20 dark:border-white/10 animate-pulse">
      {/* 封面图骨架 */}
      <div className="relative h-48 w-full bg-neutral-300 dark:bg-neutral-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-200/50 to-transparent dark:via-neutral-600/50 animate-shimmer" />
      </div>

      {/* 内容骨架 */}
      <div className="p-6 flex flex-col flex-grow space-y-4">
        {/* 标签骨架 */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-16 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <div className="h-6 w-20 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </div>

        {/* 标题骨架 */}
        <div className="space-y-2">
          <div className="h-7 bg-neutral-300 dark:bg-neutral-700 rounded w-full" />
          <div className="h-7 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4" />
        </div>

        {/* 评分骨架 */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded bg-neutral-300 dark:bg-neutral-700" />
            ))}
          </div>
          <div className="h-4 w-12 rounded bg-neutral-300 dark:bg-neutral-700" />
        </div>

        {/* 摘要骨架 */}
        <div className="space-y-2 flex-grow">
          <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-full" />
          <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-full" />
          <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-2/3" />
        </div>

        {/* 底部信息骨架 */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="h-4 w-24 rounded bg-neutral-300 dark:bg-neutral-700" />
          <div className="h-5 w-24 rounded bg-neutral-300 dark:bg-neutral-700" />
        </div>
      </div>
    </div>
  );
};

export default BlogCardSkeleton;
