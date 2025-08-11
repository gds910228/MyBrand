export default function Loading() {
  return (
    <>
      {/* Hero Skeleton */}
      <section className="py-16 md:py-24 bg-neutral-light dark:bg-dark-bg-secondary">
        <div className="container mx-auto max-w-3xl">
          <div className="rounded-2xl p-8 glass-surface border border-white/20 dark:border-white/10">
            <div className="h-8 md:h-12 w-40 md:w-56 bg-neutral-200 dark:bg-neutral-700 rounded mb-4 animate-pulse" />
            <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          </div>
        </div>
      </section>

      {/* Controls Skeleton */}
      <section className="py-8">
        <div className="container mx-auto flex flex-wrap gap-3 justify-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 glass-surface border border-white/20 dark:border-white/10 rounded-full animate-pulse"
            />
          ))}
        </div>
      </section>

      {/* Cards Skeleton */}
      <section className="py-12">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden glass-surface border border-white/20 dark:border-white/10"
            >
              <div className="h-48 w-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
              <div className="p-6">
                <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-3 animate-pulse" />
                <div className="h-6 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded mb-2 animate-pulse" />
                <div className="h-6 w-2/3 bg-neutral-200 dark:bg-neutral-700 rounded mb-6 animate-pulse" />
                <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}