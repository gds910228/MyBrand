"use client";

import React from 'react';
import Section from './Section';
import SectionHeading from './SectionHeading';
import BlogCard from './BlogCard';
import Button from './Button';
import { blogPosts, categories } from '@/data/blog';

interface LatestPostsProps {
  locale?: string;
}

const LatestPosts: React.FC<LatestPostsProps> = ({ locale = 'en' }) => {
  const latestPosts = [...blogPosts]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

  return (
    <Section id="latest-posts" bgColor="bg-neutral-light">
      <SectionHeading
        title={locale === 'zh' ? "最新文章" : "Latest Articles"}
        subtitle={
          locale === 'zh' 
            ? "阅读我关于网页开发和设计的最新想法、教程和见解。" 
            : "Read my latest thoughts, tutorials, and insights on web development and design."
        }
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {latestPosts.map((post) => (
          <BlogCard
            key={post.id}
            title={locale === 'zh' ? post.title.zh : post.title.en}
            excerpt={locale === 'zh' ? post.excerpt.zh : post.excerpt.en}
            coverImage={post.coverImage}
            publishedAt={post.publishedAt}
            slug={post.slug}
            locale={locale}
            categories={post.categories.map(catName => {
              const category = categories.find(c => c.name === catName);
              return {
                name: catName,
                label: locale === 'zh' ? category?.label.zh || catName : category?.label.en || catName
              };
            })}
          />
        ))}
      </div>
      
      <div className="mt-8 sm:mt-10 md:mt-12 text-center">
        <Button href={locale === 'zh' ? "/zh/blog" : "/blog"} variant="outline">
          {locale === 'zh' ? "查看所有文章" : "View All Articles"}
        </Button>
      </div>
    </Section>
  );
};

export default LatestPosts; 