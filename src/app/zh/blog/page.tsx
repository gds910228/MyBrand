import Section from '@/components/Section';
import BlogCard from '@/components/BlogCard';
import ContactCTA from '@/components/ContactCTA';
import { getAllBlogPosts } from '@/services/notion';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import BlogViewManager from '@/components/BlogViewManager';
import EnhancedTagCloud from '@/components/EnhancedTagCloud';

// 博客列表页面（中文）
// 支持查询参数：?tag=xxx&page=1&pageSize=9&sort=desc|asc

// ISR 缓存配置：每小时重新验证一次
export const revalidate = 3600;

export default async function BlogPageZh({
  searchParams,
}: {
  searchParams?: { tag?: string; page?: string; pageSize?: string; sort?: 'asc' | 'desc'; view?: 'grid' | 'list' };
}) {
  // 中文站点：只取 Chinese
  const blogPosts = await getAllBlogPosts({ language: 'Chinese' });

  // 解析查询参数
  const activeTag = searchParams?.tag ? decodeURIComponent(searchParams.tag as string) : undefined;
  const sort = searchParams?.sort === 'asc' ? 'asc' : 'desc';
  const view = searchParams?.view === 'list' ? 'list' : 'grid';
  const pageSizeRaw = parseInt(String(searchParams?.pageSize ?? '9'), 10);
  const pageSize = Number.isFinite(pageSizeRaw) ? Math.min(24, Math.max(3, pageSizeRaw)) : 9;

  // 过滤
  const filtered = activeTag ? blogPosts.filter((p) => (p.tags ?? []).includes(activeTag)) : blogPosts;

  // 排序（按 date ISO 字符串）
  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return sort === 'asc' ? da - db : db - da;
  });

  // 分页
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPageRaw = parseInt(String(searchParams?.page ?? '1'), 10);
  const currentPage = Number.isFinite(currentPageRaw)
    ? Math.min(totalPages, Math.max(1, currentPageRaw))
    : 1;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paged = sorted.slice(start, end);

  // 获取所有唯一标签（来自完整列表）
  const allTags = Array.from(new Set(blogPosts.flatMap((post) => post.tags ?? [])));

  // 计算每个标签的文章数量
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = blogPosts.filter((post) => (post.tags ?? []).includes(tag)).length;
    return acc;
  }, {} as Record<string, number>);

  // 构建带参链接
  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (activeTag) params.set('tag', activeTag);
    params.set('sort', sort);
    params.set('view', view);
    params.set('pageSize', String(pageSize));
    params.set('page', String(currentPage));
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === '') {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    }
    const qs = params.toString();
    return qs ? `/zh/blog?${qs}` : `/zh/blog`;
  };

  return (
    <>
      <BlogViewManager currentView={view} />
      {/* Hero Section */}
      <Section
        id="blog-hero"
        bgColor="bg-neutral-light dark:bg-dark-bg-secondary"
        className="relative overflow-hidden bg-tech-grid"
      >
        <div className="max-w-3xl mx-auto">
          <div className="glass-surface border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-md text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-heading bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent mb-4">
              博客
            </h1>
            <p className="text-lg text-neutral-dark dark:text-dark-neutral-dark">
              分享我对科技、设计和开发的思考
            </p>
          </div>
        </div>
      </Section>

      {/* 统计 + 控件 */}
      <Section id="blog-stats" className="py-8">
        <div className="text-center space-y-4">
          <p className="text-neutral-dark text-xs">
            当前显示 {paged.length} / 共 {total} 篇文章
            {allTags.length > 0 && ` • ${allTags.length} 个标签`}
            {activeTag ? ` • 按 #${activeTag} 筛选` : ''}
          </p>

          {/* 排序与视图切换 */}
          <div className="flex flex-wrap gap-3 justify-center items-center">
            <span className="text-neutral-medium">排序:</span>
            <Link
              href={buildHref({ sort: 'desc', page: '1' })}
              className={`px-3 py-1 rounded-full text-sm glass-surface border border-white/20 dark:border-white/10 neon-hover ${
                sort === 'desc' ? 'bg-primary/15 text-primary border-primary/40 dark:bg-primary/20' : ''
              }`}
            >
              最新
            </Link>
            <Link
              href={buildHref({ sort: 'asc', page: '1' })}
              className={`px-3 py-1 rounded-full text-sm glass-surface border border-white/20 dark:border-white/10 neon-hover ${
                sort === 'asc' ? 'bg-primary/15 text-primary border-primary/40 dark:bg-primary/20' : ''
              }`}
            >
              最旧
            </Link>

            <span className="text-neutral-medium ml-4">视图:</span>
            <Link
              href={buildHref({ view: 'grid' })}
              className={`px-3 py-1 rounded-full text-sm glass-surface border border-white/20 dark:border-white/10 neon-hover ${
                view === 'grid' ? 'bg-primary/15 text-primary border-primary/40 dark:bg-primary/20' : ''
              }`}
              aria-pressed={view === 'grid'}
              aria-label="切换为网格视图"
            >
              网格
            </Link>
            <Link
              href={buildHref({ view: 'list' })}
              className={`px-3 py-1 rounded-full text-sm glass-surface border border-white/20 dark:border-white/10 neon-hover ${
                view === 'list' ? 'bg-primary/15 text-primary border-primary/40 dark:bg-primary/20' : ''
              }`}
              aria-pressed={view === 'list'}
              aria-label="切换为列表视图"
            >
              列表
            </Link>
          </div>
        </div>
      </Section>

      {/* 标签区 */}
      {allTags.length > 0 && (
        <Section id="blog-tags" className="py-4">
          <div className="max-w-5xl mx-auto">
            <EnhancedTagCloud
              tags={allTags}
              tagCounts={tagCounts}
              activeTag={activeTag}
              locale="zh"
              defaultVisibleCount={10}
              baseUrl="/zh/blog"
              enableSearch={true}
              enableGrouping={false}
            />
          </div>
        </Section>
      )}

      {/* 博客列表 */}
      <Section id="blog-posts">
        {paged.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto space-y-6">
              {/* 插图或图标 */}
              <div className="text-8xl mb-4 animate-bounce">
                {activeTag ? '🔍' : '📝'}
              </div>

              <div className="glass-surface border border-white/20 dark:border-white/10 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-neutral-darker dark:text-dark-neutral-darker mb-3">
                  {activeTag ? '没有找到文章' : '暂无博客文章'}
                </h3>

                <p className="text-neutral-dark dark:text-dark-neutral-dark mb-6">
                  {activeTag
                    ? `没有找到标签为 "${activeTag}" 的文章。尝试探索其他主题或浏览所有文章。`
                    : '请稍后再来查看新内容！我们正在为您准备关于Web开发、设计和技术的精彩文章。'}
                </p>

                {/* 操作按钮 */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {activeTag && (
                    <Link
                      href="/zh/blog"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium bg-primary hover:bg-primary-dark text-white transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      清除筛选
                    </Link>
                  )}

                  <Link
                    href="/zh/projects"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium glass-surface border border-white/20 dark:border-white/10 hover:scale-105 transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    查看项目
                  </Link>
                </div>
              </div>

              {/* 建议 */}
              {!activeTag && allTags.length > 0 && (
                <div className="text-sm text-neutral-medium">
                  或探索这些主题{' '}
                  {allTags.slice(0, 3).map((tag, i) => (
                    <span key={tag}>
                      <Link
                        href={`/zh/blog?tag=${encodeURIComponent(tag)}`}
                        className="text-primary hover:underline"
                      >
                        #{tag}
                      </Link>
                      {i < Math.min(2, allTags.length - 1) && '、'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {paged.map((post) => (
                  <BlogCard
                    key={post.id}
                    title={post.title}
                    excerpt={post.excerpt}
                    coverImage={post.coverImage}
                    publishedAt={post.date}
                    slug={post.slug}
                    locale="zh"
                    ratingOverall={post.ratingOverall}
                    categories={(post.tags ?? []).map((tag: string) => ({
                      name: tag,
                      label: tag,
                    }))}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {paged.map((post) => (
                  <Link
                    key={post.id}
                    href={`/zh/blog/${post.slug}`}
                    className="group flex gap-4 p-4 rounded-lg glass-surface border border-white/20 dark:border-white/10 neon-hover"
                  >
                    <div className="relative w-40 h-24 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={post.coverImage || '/images/covers/placeholder.svg'}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 40vw, 320px"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-neutral-darker dark:text-dark-neutral-darker line-clamp-1">
                        {post.title}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-dark dark:text-dark-neutral-dark line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="mt-2 text-xs text-neutral-medium dark:text-dark-neutral-medium">
                        {format(new Date(post.date), 'yyyy-MM-dd')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* 分页 */}
            <div className="flex flex-wrap justify-center items-center gap-3 mt-10">
              <Link
                href={buildHref({ page: String(Math.max(1, currentPage - 1)) })}
                className={`px-4 py-2 rounded-full text-sm glass-surface border border-white/20 dark:border-white/10 neon-hover ${
                  currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                上一页
              </Link>
              <span className="text-neutral-medium">
                第 {currentPage} / {totalPages} 页
              </span>
              <Link
                href={buildHref({ page: String(Math.min(totalPages, currentPage + 1)) })}
                className={`px-4 py-2 rounded-full text-sm glass-surface border border-white/20 dark:border-white/10 neon-hover ${
                  currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                下一页
              </Link>

              <span className="text-neutral-medium ml-4">每页:</span>
              {['6', '9', '12'].map((n) => (
                <Link
                  key={n}
                  href={buildHref({ pageSize: n, page: '1' })}
                  className={`px-3 py-1 rounded-full text-sm glass-surface border border-white/20 dark:border-white/10 neon-hover ${
                    String(pageSize) === n ? 'bg-primary/15 text-primary border-primary/40 dark:bg-primary/20' : ''
                  }`}
                >
                  {n}
                </Link>
              ))}
            </div>
          </>
        )}
      </Section>

      <ContactCTA />
    </>
  );
}