import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import BlogCard from '@/components/BlogCard';
import ContactCTA from '@/components/ContactCTA';
import { getAllBlogPosts } from '@/services/notion';

// 博客列表页面（中文）
export default async function BlogPageZh({ searchParams }: { searchParams?: { tag?: string } }) {
  const blogPosts = await getAllBlogPosts({ language: 'Chinese' });
  const activeTag = searchParams?.tag ? decodeURIComponent(searchParams.tag as string) : undefined;
  const filteredPosts = activeTag ? blogPosts.filter(p => (p.tags ?? []).includes(activeTag)) : blogPosts;
  
  // 获取所有唯一标签
  const allTags = Array.from(new Set(blogPosts.flatMap(post => (post.tags ?? []))));
  
  return (
    <>
      {/* Hero Section */}
      <Section id="blog-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary" className="relative overflow-hidden bg-tech-grid">
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
        
        {/* Stats */}
        <div className="text-center mt-8">
          <p className="text-neutral-dark">
            {filteredPosts.length} 篇文章
            {allTags.length > 0 && ` • ${allTags.length} 个标签`}
            {activeTag ? ` • 按 #${activeTag} 筛选` : ''}
          </p>
        </div>
        
        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-8 mb-12">
            {allTags.map((tag: string) => (
                <Link
                  key={tag}
                  href={activeTag === tag ? `/zh/blog` : `/zh/blog?tag=${encodeURIComponent(tag)}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium glass-surface border border-white/20 dark:border-white/10 text-neutral-dark dark:text-dark-neutral-dark neon-hover ${activeTag === tag ? 'bg-primary/15 text-primary border-primary/40 dark:bg-primary/20' : ''}`}
                >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </Section>
      
      {/* Blog Posts */}
      <Section id="blog-posts">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-dark dark:text-dark-neutral-dark text-lg">
              没有找到博客文章。
            </p>
            <p className="text-neutral-medium mt-2">
              请稍后再来查看新内容！
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <BlogCard
                key={post.id}
                title={post.title}
                excerpt={post.excerpt}
                coverImage={post.coverImage}
                publishedAt={post.date}
                slug={post.slug}
                locale="zh"
                categories={post.tags?.map((tag: string) => ({
                  name: tag,
                  label: tag
                })) || []}
              />
            ))}
          </div>
        )}
      </Section>
      
      <ContactCTA />
    </>
  );
} 

// 添加 Link 导入
import Link from 'next/link';