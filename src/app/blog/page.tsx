import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import Container from '@/components/Container';
import Image from 'next/image';
import Link from 'next/link';
import BlogCard from '@/components/BlogCard';
import { getAllBlogPosts } from '@/services/notion';
import { format } from 'date-fns';

// 博客列表页面（英文）
// 支持查询参数：?tag=xxx&page=1&pageSize=9&sort=desc|asc
export default async function BlogPage({
  searchParams,
}: {
  searchParams?: { tag?: string; page?: string; pageSize?: string; sort?: 'asc' | 'desc' };
}) {
  // 英文站点：只取 English
  const blogPosts = await getAllBlogPosts({ language: 'English' });

  // 解析查询参数
  const activeTag = searchParams?.tag ? decodeURIComponent(searchParams.tag as string) : undefined;
  const sort = searchParams?.sort === 'asc' ? 'asc' : 'desc';
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

  // 构建带参链接
  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (activeTag) params.set('tag', activeTag);
    params.set('sort', sort);
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
    return qs ? `/blog?${qs}` : `/blog`;
  };

  return (
    <>
      {/* Hero Section */}
      <Section
        id="blog-hero"
        bgColor="bg-neutral-light dark:bg-dark-bg-secondary"
        className="relative overflow-hidden bg-tech-grid"
      >
        <div className="max-w-3xl mx-auto">
          <div className="glass-surface border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-md text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-heading bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent mb-4">
              Blog
            </h1>
            <p className="text-lg text-neutral-dark dark:text-dark-neutral-dark">
              Thoughts, insights, and perspectives on web development, design, and technology.
            </p>
          </div>
        </div>
      </Section>

      {/* Stats + Controls */}
      <Section id="blog-stats" className="py-8">
        <div className="text-center space-y-4">
          <p className="text-neutral-dark">
            {paged.length} of {total} {total === 1 ? 'article' : 'articles'}
            {allTags.length > 0 && ` • ${allTags.length} ${allTags.length === 1 ? 'tag' : 'tags'}`}
            {activeTag ? ` • filtered by #${activeTag}` : ''}
          </p>

          {/* 排序与每页数量控制（链接形式） */}
          <div className="flex flex-wrap gap-3 justify-center items-center">
            <span className="text-neutral-medium">Sort:</span>
            <Link
              href={buildHref({ sort: 'desc', page: '1' })}
              className={`px-3 py-1 rounded-full text-sm glass-surface border border-white/20 dark:border-white/10 neon-hover ${
                sort === 'desc' ? 'bg-primary/15 text-primary border-primary/40 dark:bg-primary/20' : ''
              }`}
            >
              Newest
            </Link>
            <Link
              href={buildHref({ sort: 'asc', page: '1' })}
              className={`px-3 py-1 rounded-full text-sm glass-surface border border-white/20 dark:border-white/10 neon-hover ${
                sort === 'asc' ? 'bg-primary/15 text-primary border-primary/40 dark:bg-primary/20' : ''
              }`}
            >
              Oldest
            </Link>

            <span className="text-neutral-medium ml-2">Per page:</span>
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
        </div>
      </Section>

      {/* Tags Section */}
      {allTags.length > 0 && (
        <Section id="blog-tags" className="py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-3 justify-center">
              {allTags.map((tag) => (
                <Link
                  key={tag}
                  href={activeTag === tag ? `/blog` : `/blog?tag=${encodeURIComponent(tag)}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium glass-surface border border-white/20 dark:border-white/10 text-neutral-dark dark:text-dark-neutral-dark neon-hover ${
                    activeTag === tag ? 'bg-primary/15 text-primary border-primary/40 dark:bg-primary/20' : ''
                  }`}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Blog Posts List */}
      <Section id="blog-posts">
        <Container>
          {paged.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-neutral-dark">No blog posts yet.</h3>
              <p className="mt-2 text-neutral-medium">Check back soon for new content!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paged.map((post) => (
                  <BlogCard
                    key={post.id}
                    title={post.title}
                    excerpt={post.excerpt}
                    coverImage={post.coverImage}
                    publishedAt={post.date}
                    slug={post.slug}
                    locale="en"
                    ratingOverall={post.ratingOverall}
                    categories={(post.tags ?? []).map((tag: string) => ({
                      name: tag,
                      label: tag,
                    }))}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center items-center gap-3 mt-10">
                <Link
                  href={buildHref({ page: String(Math.max(1, currentPage - 1)) })}
                  className={`px-4 py-2 rounded-full text-sm glass-surface border border-white/20 dark:border-white/10 neon-hover ${
                    currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  Prev
                </Link>
                <span className="text-neutral-medium">
                  Page {currentPage} / {totalPages}
                </span>
                <Link
                  href={buildHref({ page: String(Math.min(totalPages, currentPage + 1)) })}
                  className={`px-4 py-2 rounded-full text-sm glass-surface border border-white/20 dark:border-white/10 neon-hover ${
                    currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  Next
                </Link>
              </div>
            </>
          )}
        </Container>
      </Section>
    </>
  );
}