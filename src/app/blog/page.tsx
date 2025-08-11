import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import Container from '@/components/Container';
import Image from 'next/image';
import Link from 'next/link';
import BlogCard from '@/components/BlogCard';
import { getAllBlogPosts } from '@/services/notion';
import { format } from 'date-fns';

// 博客列表页面
export default async function BlogPage({ searchParams }: { searchParams?: { tag?: string } }) {
  // 英文站点：只取 English
  const blogPosts = await getAllBlogPosts({ language: 'English' });
  const activeTag = searchParams?.tag ? decodeURIComponent(searchParams.tag as string) : undefined;
  const filteredPosts = activeTag ? blogPosts.filter(p => (p.tags ?? []).includes(activeTag)) : blogPosts;
  
  // 获取所有唯一标签
  const allTags = Array.from(new Set(blogPosts.flatMap(post => post.tags ?? [])));
  
  return (
    <>
      {/* Hero Section */}
      <Section id="blog-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary" className="relative overflow-hidden bg-tech-grid">
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
      
      {/* Stats Section */}
      <Section id="blog-stats" className="py-8">
        <div className="text-center">
          <p className="text-neutral-dark">
            {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}
            {allTags.length > 0 && ` • ${allTags.length} ${allTags.length === 1 ? 'tag' : 'tags'}`}
            {activeTag ? ` • filtered by #${activeTag}` : ''}
          </p>
        </div>
      </Section>
      
      {/* Tags Section */}
      {allTags.length > 0 && (
        <Section id="blog-tags" className="py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-3 justify-center">
              {allTags.map(tag => (
                <Link
                  key={tag}
                  href={activeTag === tag ? `/blog` : `/blog?tag=${encodeURIComponent(tag)}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium glass-surface border border-white/20 dark:border-white/10 text-neutral-dark dark:text-dark-neutral-dark neon-hover ${activeTag === tag ? 'bg-primary/15 text-primary border-primary/40 dark:bg-primary/20' : ''}`}
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
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-neutral-dark">No blog posts yet.</h3>
              <p className="mt-2 text-neutral-medium">Check back soon for new content!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map(post => (
                <BlogCard
                  key={post.id}
                  title={post.title}
                  excerpt={post.excerpt}
                  coverImage={post.coverImage}
                  publishedAt={post.date}
                  slug={post.slug}
                  locale="en"
                  categories={(post.tags ?? []).map((tag: string) => ({
                    name: tag,
                    label: tag
                  }))} 
                />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}