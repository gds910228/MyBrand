import React from 'react';
import BlogCard from '@/components/BlogCard';
import Section from '@/components/Section';
import Container from '@/components/Container';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  coverImage: string;
  date: string;
  slug: string;
  tags?: string[];
  ratingOverall?: number;
}

export interface RelatedPostsProps {
  /**
   * 当前文章的数据
   */
  currentPost: BlogPost;
  /**
   * 所有文章列表
   */
  allPosts: BlogPost[];
  /**
   * 最多显示几篇相关文章
   */
  maxPosts?: number;
  /**
   * 语言区域设置
   */
  locale?: 'en' | 'zh';
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({
  currentPost,
  allPosts,
  maxPosts = 3,
  locale = 'en',
}) => {
  // 计算相关文章
  const getRelatedPosts = (): BlogPost[] => {
    // 排除当前文章
    const otherPosts = allPosts.filter(post => post.id !== currentPost.id);

    // 计算每篇文章的相关性分数
    const scoredPosts = otherPosts.map(post => {
      let score = 0;

      // 1. 标签匹配（每个共同标签 +10 分）
      const currentTags = currentPost.tags || [];
      const postTags = post.tags || [];
      const commonTags = currentTags.filter(tag => postTags.includes(tag));
      score += commonTags.length * 10;

      // 2. 如果没有共同标签，降级为随机推荐
      if (commonTags.length === 0) {
        score += Math.random() * 2;
      }

      return { post, score };
    });

    // 按分数排序，并取前 N 篇
    return scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPosts)
      .map(item => item.post);
  };

  const relatedPosts = getRelatedPosts();

  // 如果没有相关文章，不显示组件
  if (relatedPosts.length === 0) {
    return null;
  }

  const title = locale === 'zh' ? '相关文章' : 'Related Posts';
  const subtitle = locale === 'zh'
    ? '您可能也喜欢这些文章'
    : 'You might also like these articles';

  return (
    <Section className="py-12 bg-neutral-light/50 dark:bg-dark-bg-secondary/50">
      <Container>
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-2">
            {title}
          </h2>
          <p className="text-neutral-medium dark:text-dark-neutral-medium">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {relatedPosts.map(post => (
            <BlogCard
              key={post.id}
              title={post.title}
              excerpt={post.excerpt}
              coverImage={post.coverImage}
              publishedAt={post.date}
              slug={post.slug}
              locale={locale}
              ratingOverall={post.ratingOverall}
              categories={(post.tags || []).map(tag => ({
                name: tag,
                label: tag,
              }))}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
};

export default RelatedPosts;
