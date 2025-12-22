"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faTags, faClock, faArrowLeft, faSearch } from '@fortawesome/free-solid-svg-icons';
import Section from '@/components/Section';
import { getAllBlogPosts } from '@/services/notion';
import Container from '@/components/Container';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  readTime?: string;
}

export default function BlogNotFound() {
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBlogContent = async () => {
      try {
        const posts = await getAllBlogPosts({ language: 'English', limit: 20 });

        // 获取最新的5篇文章
        setRecentPosts(posts.slice(0, 5));

        // 提取并统计热门标签
        const tagCounts: { [key: string]: number } = {};
        posts.forEach(post => {
          if (post.tags) {
            post.tags.forEach((tag: string) => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        });

        // 获取前8个热门标签
        const sortedTags = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)
          .map(([tag]) => tag);

        setPopularTags(sortedTags);
      } catch (error) {
        console.error('[BlogNotFound] Failed to load blog content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBlogContent();
  }, []);

  return (
    <>
      <title>Article Not Found - MisoTech Blog</title>
      <meta name="robots" content="noindex" />

      <Section bgColor="bg-neutral-light dark:bg-dark-bg-secondary" className="py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <div className="mb-8">
              <FontAwesomeIcon
                icon={faFileAlt}
                className="w-16 h-16 text-warning mb-4"
              />
              <h1 className="text-4xl md:text-5xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
                Article Not Found
              </h1>
            </div>

            <p className="text-lg text-neutral-dark dark:text-dark-neutral-dark mb-8">
              The article you're looking for might have been moved, deleted, or the URL might be incorrect.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                Back to Blog
              </Link>

              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-6 py-3 glass-surface border border-white/20 dark:border-white/10 rounded-lg hover:scale-105 transition-transform"
              >
                <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                Search Articles
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* Recent Articles Recommendations */}
      {!isLoading && recentPosts.length > 0 && (
        <Section className="py-16">
          <Container>
            <h2 className="text-2xl font-bold text-center mb-12 text-neutral-darker dark:text-dark-neutral-darker">
              Recent Articles
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block p-6 rounded-xl glass-surface border border-white/20 dark:border-white/10 hover:scale-[1.02] transition-transform"
                >
                  <h3 className="font-semibold text-lg text-neutral-darker dark:text-dark-neutral-darker mb-3 line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-sm text-neutral-dark dark:text-dark-neutral-dark mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags && post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded-full bg-primary-light/20 text-primary dark:bg-dark-primary-light/20 dark:text-dark-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-neutral-dark/60 dark:text-dark-neutral-dark/60">
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                      <span>{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                    {post.readTime && (
                      <span>{post.readTime}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-primary dark:text-dark-primary font-medium hover:underline"
              >
                View All Articles
                <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3 rotate-180" />
              </Link>
            </div>
          </Container>
        </Section>
      )}

      {/* Popular Tags */}
      {!isLoading && popularTags.length > 0 && (
        <Section className="py-16 bg-neutral-light/50 dark:bg-dark-bg-secondary/50">
          <Container>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 text-neutral-darker dark:text-dark-neutral-darker">
                Browse Popular Tags
              </h2>
              <p className="text-neutral-dark dark:text-dark-neutral-dark mb-8">
                Click on tags to view related articles
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                {popularTags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-surface border border-white/20 dark:border-white/10 hover:scale-105 transition-transform text-sm font-medium"
                  >
                    <FontAwesomeIcon icon={faTags} className="w-3 h-3" />
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}