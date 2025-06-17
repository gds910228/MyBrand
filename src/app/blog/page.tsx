"use client";

import React, { useState } from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import Container from '@/components/Container';
import Image from 'next/image';
import Link from 'next/link';
import BlogCard from '@/components/BlogCard';
import { blogPosts, categories } from '@/data/blog';

// 获取所有唯一标签
const allTags = Array.from(new Set(blogPosts.flatMap(post => post.categories)));

export default function BlogPage() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // 根据选择的标签过滤文章
  const filteredPosts = selectedTag 
    ? blogPosts.filter(post => post.categories.includes(selectedTag))
    : blogPosts;
  
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
      
      {/* Tags Filter */}
      <Section id="blog-tags" className="py-8">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedTag === null 
                ? 'bg-primary text-white' 
                : 'bg-neutral-light text-neutral-dark hover:bg-neutral-medium/20'
            }`}
          >
            All Posts
          </button>
          
          {allTags.map(tag => {
            const category = categories.find(c => c.name === tag);
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === tag 
                    ? 'bg-primary text-white' 
                    : 'bg-neutral-light text-neutral-dark hover:bg-neutral-medium/20'
                }`}
              >
                {category ? category.label.en : tag}
              </button>
            );
          })}
        </div>
      </Section>
      
      {/* Blog Posts List */}
      <Section id="blog-posts">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-neutral-dark">No posts found for this tag.</h3>
            <p className="mt-2 text-neutral-medium">Try selecting a different tag or view all posts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map(post => (
              <BlogCard
                key={post.id}
                title={post.title.en}
                excerpt={post.excerpt.en}
                coverImage={post.coverImage}
                publishedAt={post.publishedAt}
                slug={post.slug}
                locale="en"
                categories={post.categories.map(catName => {
                  const category = categories.find(c => c.name === catName);
                  return {
                    name: catName,
                    label: category?.label.en || catName
                  };
                })}
              />
            ))}
          </div>
        )}
      </Section>
    </>
  );
} 