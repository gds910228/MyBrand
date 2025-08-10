import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import BlogCard from '@/components/BlogCard';
import ContactCTA from '@/components/ContactCTA';
import { getAllBlogPosts } from '@/services/notion';

// 博客列表页面（中文）
export default async function BlogPageZh() {
  const blogPosts = await getAllBlogPosts();
  
  // 获取所有唯一标签
  const allTags = Array.from(new Set(blogPosts.flatMap(post => post.tags)));
  
  return (
    <>
      {/* Hero Section */}
      <Section id="blog-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading 
          title="博客" 
          subtitle="分享我对科技、设计和开发的思考"
          centered
        />
        
        {/* Stats */}
        <div className="text-center mt-8">
          <p className="text-neutral-dark">
            {blogPosts.length} {blogPosts.length === 1 ? '篇文章' : '篇文章'}
            {allTags.length > 0 && ` • ${allTags.length} 个${allTags.length === 1 ? '标签' : '标签'}`}
          </p>
        </div>
        
        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-8 mb-12">
            {allTags.map(tag => (
              <Link
                key={tag}
                href={`/zh/blog?tag=${encodeURIComponent(tag)}`}
                className="px-4 py-2 rounded-full text-sm font-medium bg-neutral-light dark:bg-dark-neutral-light text-neutral-dark dark:text-dark-neutral-dark hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </Section>
      
      {/* Blog Posts */}
      <Section id="blog-posts">
        {blogPosts.length === 0 ? (
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
            {blogPosts.map((post) => (
              <BlogCard
                key={post.id}
                title={post.title}
                excerpt={post.excerpt}
                coverImage={post.coverImage}
                publishedAt={post.date}
                slug={post.slug}
                locale="zh"
                categories={post.tags?.map(tag => ({
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