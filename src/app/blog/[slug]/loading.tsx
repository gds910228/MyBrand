export default function BlogPostLoading() {
  return (
    <>
      {/* Hero Section 骨架屏 */}
      <section className="bg-neutral-light dark:bg-dark-bg-secondary py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center mb-8 space-y-4">
            {/* 标签骨架 */}
            <div className="flex justify-center flex-wrap gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-7 w-20 rounded-full bg-neutral-300 dark:bg-neutral-700 animate-pulse" />
              ))}
            </div>

            {/* 标题骨架 */}
            <div className="space-y-3">
              <div className="h-10 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4 mx-auto animate-pulse" />
              <div className="h-10 bg-neutral-300 dark:bg-neutral-700 rounded w-1/2 mx-auto animate-pulse" />
            </div>

            {/* 元信息骨架 */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <div className="h-5 w-32 bg-neutral-300 dark:bg-neutral-700 rounded animate-pulse" />
              <div className="h-5 w-24 bg-neutral-300 dark:bg-neutral-700 rounded animate-pulse" />
              <div className="h-5 w-28 bg-neutral-300 dark:bg-neutral-700 rounded animate-pulse" />
            </div>
          </div>

          {/* 封面图骨架 */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg mb-8 bg-neutral-300 dark:bg-neutral-700 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-200/50 to-transparent dark:via-neutral-600/50 animate-shimmer" />
          </div>
        </div>
      </section>

      {/* 内容骨架屏 */}
      <section>
        <div className="container mx-auto max-w-4xl px-4">
          {/* 摘要骨架 */}
          <div className="mb-8 space-y-3">
            <div className="h-6 bg-neutral-300 dark:bg-neutral-700 rounded w-full animate-pulse" />
            <div className="h-6 bg-neutral-300 dark:bg-neutral-700 rounded w-5/6 animate-pulse" />
          </div>

          {/* 工具信息骨架 */}
          <div className="mb-8 space-y-4">
            <div className="h-20 bg-neutral-300 dark:bg-neutral-700 rounded-lg animate-pulse" />
            <div className="h-32 bg-neutral-300 dark:bg-neutral-700 rounded-lg animate-pulse" />
          </div>

          {/* 正文内容骨架 */}
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-full animate-pulse" />
                <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-full animate-pulse" />
                <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-11/12 animate-pulse" />
              </div>
            ))}
          </div>

          {/* 返回按钮骨架 */}
          <div className="my-12">
            <div className="h-8 w-40 bg-neutral-300 dark:bg-neutral-700 rounded animate-pulse" />
          </div>
        </div>
      </section>

      {/* 评论区骨架 */}
      <section>
        <div className="container mx-auto max-w-4xl px-4">
          <div className="space-y-6">
            <div className="h-8 bg-neutral-300 dark:bg-neutral-700 rounded w-1/4 animate-pulse" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-surface border border-white/20 dark:border-white/10 rounded-lg p-6 space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-neutral-300 dark:bg-neutral-700 rounded" />
                    <div className="h-3 w-32 bg-neutral-300 dark:bg-neutral-700 rounded" />
                  </div>
                </div>
                <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-full" />
                <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
