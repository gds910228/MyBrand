import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import Container from '@/components/Container';
import Image from 'next/image';
import Link from 'next/link';
import BlogCard from '@/components/BlogCard';
import { getAllBlogPosts } from '@/services/notion';
import { format } from 'date-fns';

// 博客列表页面
export default async function BlogPage() {
  // 英文站点：只取 English
  const blogPosts = await getAllBlogPosts({ language: 'English' });
  
  // 获取所有唯一标签
  const allTags = Array.from(new Set(blogPosts.flatMap(post => post.tags ?? [])));
  
  return (
    <>
      {/* Hero Section */}
      <Section id="blog-hero" bgColor="bg-neutral-light">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-neutral-darker mb-6">
            Blog
          </h1>
          <p className="text-lg text-neutral-dark">
            Thoughts, insights, and perspectives on web development, design, and technology.
          </p>
        </div>
      </Section>
      
      {/* Stats Section */}
      <Section id="blog-stats" className="py-8">
        <div className="text-center">
          <p className="text-neutral-dark">
            {blogPosts.length} {blogPosts.length === 1 ? 'article' : 'articles'}
            {allTags.length > 0 && ` • ${allTags.length} ${allTags.length === 1 ? 'tag' : 'tags'}`}
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
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-neutral-light dark:bg-dark-neutral-light text-neutral-dark dark:text-dark-neutral-dark hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
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
          {blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-neutral-dark">No blog posts yet.</h3>
              <p className="mt-2 text-neutral-medium">Check back soon for new content!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map(post => (
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