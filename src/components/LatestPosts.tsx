import Section from './Section';
import SectionHeading from './SectionHeading';
import BlogCard from './BlogCard';
import Button from './Button';
import { getAllBlogPosts } from '@/services/notion';

interface LatestPostsProps {
  locale?: 'en' | 'zh';
}

export default async function LatestPosts({ locale = 'en' }: LatestPostsProps) {
  const language = locale === 'zh' ? 'Chinese' : 'English';

  // 从 Notion 获取对应语言的文章列表
  const posts = await getAllBlogPosts({ language });

  // 调试：打印文章信息
  console.log(`[LatestPosts] 获取到 ${posts.length} 篇文章，语言: ${language}`);
  posts.forEach((post, index) => {
    console.log(`[LatestPosts] 文章 ${index + 1}: ${post.title}, 日期: ${post.date}, 封面: ${post.coverImage?.substring(0, 100)}...`);
  });

  // 以 PublishDate 映射的 date 字段降序，再取前三篇
  const latestPosts = (posts || [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  console.log('[LatestPosts] 最新的3篇文章:', latestPosts.map(p => p.title));

  return (
    <Section id="latest-posts" bgColor="bg-neutral-light">
      <SectionHeading
        title={locale === 'zh' ? '最新文章' : 'Latest Articles'}
        subtitle={
          locale === 'zh'
            ? '阅读我关于网页开发和设计的最新想法、教程和见解。'
            : 'Read my latest thoughts, tutorials, and insights on web development and design.'
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {latestPosts.map((post) => (
          <BlogCard
            key={post.id}
            title={post.title}
            excerpt={post.excerpt}
            coverImage={post.coverImage}
            publishedAt={post.date}
            slug={post.slug}
            locale={locale}
            ratingOverall={post.ratingOverall}
            categories={(post.tags || []).map((t: string) => ({
              name: t,
              label: t,
            }))}
          />
        ))}
      </div>

      <div className="mt-8 sm:mt-10 md:mt-12 text-center">
        <Button href={locale === 'zh' ? '/zh/blog' : '/blog'} variant="outline">
          {locale === 'zh' ? '查看所有文章' : 'View All Articles'}
        </Button>
      </div>
    </Section>
  );
}