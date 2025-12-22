"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faSearch, faFire, faArrowLeft, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import Section from '@/components/Section';
import { getAllBlogPosts, getAllProjects } from '@/services/notion';
import Container from '@/components/Container';

interface RelatedContent {
  posts: any[];
  projects: any[];
}

export default function NotFound() {
  const [relatedContent, setRelatedContent] = useState<RelatedContent>({
    posts: [],
    projects: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRelatedContent = async () => {
      try {
        const [posts, projects] = await Promise.all([
          getAllBlogPosts({ language: 'English', limit: 6 }),
          getAllProjects({ limit: 6 })
        ]);

        setRelatedContent({
          posts: posts.slice(0, 3), // 显示前3篇最新文章
          projects: projects.slice(0, 3) // 显示前3个项目
        });
      } catch (error) {
        console.error('[NotFound] Failed to load related content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRelatedContent();
  }, []);

  return (
    <>
      <title>页面未找到 - MisoTech</title>
      <meta name="robots" content="noindex" />

      <Section bgColor="bg-neutral-light dark:bg-dark-bg-secondary" className="py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            {/* 404 图标和标题 */}
            <div className="mb-8">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="w-16 h-16 text-warning mb-4"
              />
              <h1 className="text-4xl md:text-5xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
                Oops! Page Not Found
              </h1>
            </div>

            {/* 错误说明 */}
            <p className="text-lg text-neutral-dark dark:text-dark-neutral-dark mb-12">
              The page you're looking for might have been moved, deleted, or the URL might be incorrect.
            </p>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4 mb-12">
              <Link
                href="/"
                className="flex flex-col items-center p-6 rounded-xl glass-surface border border-white/20 dark:border-white/10 hover:scale-105 transition-transform"
              >
                <FontAwesomeIcon icon={faHome} className="w-8 h-8 text-primary mb-3" />
                <span className="font-medium">Back to Home</span>
              </Link>

              <Link
                href="/blog"
                className="flex flex-col items-center p-6 rounded-xl glass-surface border border-white/20 dark:border-white/10 hover:scale-105 transition-transform"
              >
                <FontAwesomeIcon icon={faSearch} className="w-8 h-8 text-primary mb-3" />
                <span className="font-medium">Browse Blog</span>
              </Link>

              <Link
                href="/projects"
                className="flex flex-col items-center p-6 rounded-xl glass-surface border border-white/20 dark:border-white/10 hover:scale-105 transition-transform"
              >
                <FontAwesomeIcon icon={faFire} className="w-8 h-8 text-primary mb-3" />
                <span className="font-medium">View Projects</span>
              </Link>
            </div>

            {/* Other Options */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/about"
                className="text-primary dark:text-dark-primary hover:underline"
              >
                About Us
              </Link>
              <Link
                href="/contact"
                className="text-primary dark:text-dark-primary hover:underline"
              >
                Contact
              </Link>
              <Link
                href="/privacy"
                className="text-primary dark:text-dark-primary hover:underline"
              >
                Privacy Policy
              </Link>
              <Link
                href="/disclaimer"
                className="text-primary dark:text-dark-primary hover:underline"
              >
                Disclaimer
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* 相关内容推荐 */}
      {!isLoading && (relatedContent.posts.length > 0 || relatedContent.projects.length > 0) && (
        <Section className="py-16">
          <Container>
            <h2 className="text-2xl font-bold text-center mb-12 text-neutral-darker dark:text-dark-neutral-darker">
              You Might Be Interested In
            </h2>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Latest Posts */}
              {relatedContent.posts.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-6 text-neutral-darker dark:text-dark-neutral-darker">
                    Latest Blog Posts
                  </h3>
                  <div className="space-y-4">
                    {relatedContent.posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="block p-4 rounded-lg glass-surface border border-white/20 dark:border-white/10 hover:scale-[1.02] transition-transform"
                      >
                        <h4 className="font-medium text-neutral-darker dark:text-dark-neutral-darker mb-2">
                          {post.title}
                        </h4>
                        <p className="text-sm text-neutral-dark dark:text-dark-neutral-dark line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-neutral-dark/60 dark:text-dark-neutral-dark/60">
                          <span>{new Date(post.date).toLocaleDateString()}</span>
                          {post.tags && post.tags.length > 0 && (
                            <span>{post.tags[0]}</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/blog"
                      className="text-primary dark:text-dark-primary font-medium hover:underline inline-flex items-center gap-2"
                    >
                      View All Posts
                      <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3 rotate-180" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Featured Projects */}
              {relatedContent.projects.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-6 text-neutral-darker dark:text-dark-neutral-darker">
                    Featured Projects
                  </h3>
                  <div className="space-y-4">
                    {relatedContent.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.slug}`}
                        className="block p-4 rounded-lg glass-surface border border-white/20 dark:border-white/10 hover:scale-[1.02] transition-transform"
                      >
                        <h4 className="font-medium text-neutral-darker dark:text-dark-neutral-darker mb-2">
                          {project.title}
                        </h4>
                        <p className="text-sm text-neutral-dark dark:text-dark-neutral-dark line-clamp-2">
                          {project.description}
                        </p>
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.technologies.slice(0, 3).map((tech: string) => (
                              <span
                                key={tech}
                                className="text-xs px-2 py-1 rounded-full bg-primary-light/20 text-primary dark:bg-dark-primary-light/20 dark:text-dark-primary"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/projects"
                      className="text-primary dark:text-dark-primary font-medium hover:underline inline-flex items-center gap-2"
                    >
                      View All Projects
                      <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3 rotate-180" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}