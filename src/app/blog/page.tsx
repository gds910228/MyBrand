"use client";

import React, { useState } from 'react';
import Section from '@/components/Section';
import SectionHeading from '@/components/SectionHeading';
import Container from '@/components/Container';
import Image from 'next/image';
import Link from 'next/link';

// 模拟博客文章数据
const blogPostsData = [
  {
    id: 'nextjs-vs-react',
    title: 'Next.js vs React: When to Choose Which',
    excerpt: 'A comprehensive comparison of Next.js and React, discussing their strengths, weaknesses, and ideal use cases for different projects.',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    date: 'June 10, 2023',
    author: 'John Doe',
    readTime: '8 min read',
    tags: ['React', 'Next.js', 'Frontend', 'JavaScript']
  },
  {
    id: 'tailwind-css-tips',
    title: 'Advanced Tailwind CSS Tips and Tricks',
    excerpt: 'Discover advanced techniques and best practices for using Tailwind CSS in your projects to create beautiful, responsive designs efficiently.',
    coverImage: 'https://images.unsplash.com/photo-1618788372246-79faff0c3742?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
    date: 'May 22, 2023',
    author: 'John Doe',
    readTime: '6 min read',
    tags: ['CSS', 'Tailwind', 'Design', 'Frontend']
  },
  {
    id: 'typescript-best-practices',
    title: 'TypeScript Best Practices for Large Projects',
    excerpt: 'Learn how to effectively use TypeScript in large-scale applications to improve code quality, maintainability, and developer experience.',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    date: 'April 15, 2023',
    author: 'John Doe',
    readTime: '10 min read',
    tags: ['TypeScript', 'JavaScript', 'Best Practices', 'Programming']
  },
  {
    id: 'api-design-principles',
    title: 'RESTful API Design Principles and Best Practices',
    excerpt: 'A guide to designing clean, intuitive, and effective RESTful APIs that developers will love to use and integrate with.',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1034&q=80',
    date: 'March 8, 2023',
    author: 'John Doe',
    readTime: '7 min read',
    tags: ['API', 'REST', 'Backend', 'Web Development']
  },
  {
    id: 'ux-design-for-developers',
    title: 'UX Design Principles for Developers',
    excerpt: 'Essential UX design principles that every developer should know to create user-friendly interfaces and improve the overall user experience.',
    coverImage: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    date: 'February 20, 2023',
    author: 'John Doe',
    readTime: '9 min read',
    tags: ['UX', 'Design', 'UI', 'Frontend']
  },
  {
    id: 'serverless-architecture',
    title: 'Introduction to Serverless Architecture',
    excerpt: 'Explore the benefits, challenges, and implementation strategies of serverless architecture for modern web applications.',
    coverImage: 'https://images.unsplash.com/photo-1599507593499-a3f7d7d97667?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    date: 'January 5, 2023',
    author: 'John Doe',
    readTime: '8 min read',
    tags: ['Serverless', 'Cloud', 'Architecture', 'AWS']
  }
];

// 获取所有唯一标签
const allTags = Array.from(new Set(blogPostsData.flatMap(post => post.tags)));

export default function BlogPage() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // 根据选择的标签过滤文章
  const filteredPosts = selectedTag 
    ? blogPostsData.filter(post => post.tags.includes(selectedTag))
    : blogPostsData;
  
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
          
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedTag === tag 
                  ? 'bg-primary text-white' 
                  : 'bg-neutral-light text-neutral-dark hover:bg-neutral-medium/20'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </Section>
      
      {/* Blog Posts List */}
      <Section id="blog-posts">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map(post => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
        
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-neutral-dark">No posts found for this tag.</h3>
            <p className="mt-2 text-neutral-medium">Try selecting a different tag or view all posts.</p>
          </div>
        )}
      </Section>
    </>
  );
}

interface BlogPostProps {
  post: {
    id: string;
    title: string;
    excerpt: string;
    coverImage: string;
    date: string;
    author: string;
    readTime: string;
    tags: string[];
  };
}

const BlogPostCard: React.FC<BlogPostProps> = ({ post }) => {
  return (
    <Link href={`/blog/${post.id}`} className="group block">
      <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        {/* Cover Image */}
        <div className="relative h-48">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-neutral-medium mb-3">
            <span>{post.date}</span>
            <span>{post.readTime}</span>
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-semibold font-heading text-neutral-darker mb-3 group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          
          {/* Excerpt */}
          <p className="text-neutral-dark mb-4 line-clamp-3">
            {post.excerpt}
          </p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.slice(0, 3).map(tag => (
              <span 
                key={tag} 
                className="px-3 py-1 bg-neutral-light text-neutral-dark text-xs rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  // 这里可以添加标签点击逻辑，但在卡片内部可能不需要
                }}
              >
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="px-3 py-1 bg-neutral-light text-neutral-dark text-xs rounded-full">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}; 