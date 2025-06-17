"use client";

import React, { useState, useEffect } from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import BlogCard from '@/components/BlogCard';
import ContactCTA from '@/components/ContactCTA';
import { blogPosts, categories, BlogPostType } from '@/data/blog';

export default function BlogPageZh() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [filteredPosts, setFilteredPosts] = useState<BlogPostType[]>(blogPosts);
  
  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredPosts(blogPosts);
    } else {
      setFilteredPosts(
        blogPosts.filter(post => 
          post.categories.includes(activeCategory)
        )
      );
    }
  }, [activeCategory]);

  return (
    <>
      {/* Hero Section */}
      <Section id="blog-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary">
        <SectionHeading 
          title="博客" 
          subtitle="分享我对科技、设计和开发的思考"
          centered
        />
        
        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-8 mb-12">
          <CategoryButton
            name="all"
            label="全部"
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')} 
          />
          {categories.map((category) => (
            <CategoryButton
              key={category.name}
              name={category.name}
              label={category.label.zh}
              active={activeCategory === category.name}
              onClick={() => setActiveCategory(category.name)}
            />
          ))}
        </div>
      </Section>
      
      {/* Blog Posts */}
      <Section id="blog-posts">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-dark dark:text-dark-neutral-dark text-lg">
              没有找到此类别的文章。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <BlogCard
                key={post.id}
                title={post.title.zh}
                excerpt={post.excerpt.zh}
                coverImage={post.coverImage}
                publishedAt={post.publishedAt}
                slug={post.slug}
                locale="zh"
                categories={post.categories.map(catName => {
                  const category = categories.find(c => c.name === catName);
                  return {
                    name: catName,
                    label: category?.label.zh || catName
                  };
                })}
              />
            ))}
          </div>
        )}
      </Section>
      
      <ContactCTA />
    </>
  );
}

// Category Button Component
interface CategoryButtonProps {
  name: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ name, label, active, onClick }) => {
  return (
    <button
      className={`px-4 py-2 rounded-full font-medium transition-colors ${
        active
          ? 'bg-primary dark:bg-dark-primary text-white'
          : 'bg-neutral-light dark:bg-dark-neutral-light text-neutral-dark dark:text-dark-neutral-dark hover:bg-neutral-muted hover:dark:bg-dark-neutral-muted'
      }`}
      onClick={onClick}
      aria-label={`Filter by ${label}`}
    >
      {label}
    </button>
  );
}; 