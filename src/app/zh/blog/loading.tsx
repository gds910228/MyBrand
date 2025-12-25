import BlogCardSkeleton from '@/components/BlogCardSkeleton';

export default function LoadingZh() {
  return (
    <>
      {/* Hero Section 骨架屏 */}
      <section
        id="blog-hero"
        className="relative overflow-hidden bg-tech-grid bg-neutral-light dark:bg-dark-bg-secondary py-20"
      >
        <div className="max-w-3xl mx-auto px-4">
          <div className="glass-surface border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-md text-center animate-pulse">
            <div className="h-12 bg-neutral-300 dark:bg-neutral-700 rounded w-1/2 mx-auto mb-4" />
            <div className="h-6 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4 mx-auto" />
          </div>
        </div>
      </section>

      {/* Stats + Controls 骨架屏 */}
      <section className="py-8">
        <div className="text-center space-y-4">
          <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-1/3 mx-auto" />
          <div className="flex flex-wrap gap-3 justify-center items-center">
            <div className="h-8 w-16 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
            <div className="h-8 w-20 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
            <div className="h-8 w-20 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
          </div>
        </div>
      </section>

      {/* Tags 骨架屏 */}
      <section className="py-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center items-center">
            <div className="h-8 w-20 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 w-24 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts 骨架屏 - 网格视图 */}
      <section>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {Array.from({ length: 9 }).map((_, i) => (
              <BlogCardSkeleton key={i} view="grid" />
            ))}
          </div>
        </div>
      </section>

      {/* 分页骨架屏 */}
      <section className="mt-10">
        <div className="flex flex-wrap justify-center items-center gap-3">
          <div className="h-10 w-20 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
          <div className="h-6 w-24 bg-neutral-300 dark:bg-neutral-700 rounded" />
          <div className="h-10 w-20 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
          <div className="h-8 w-16 bg-neutral-300 dark:bg-neutral-700 rounded-full ml-4" />
          <div className="h-8 w-12 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
          <div className="h-8 w-12 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
        </div>
      </section>
    </>
  );
}