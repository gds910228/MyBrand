"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format, isValid, parseISO } from 'date-fns';
import { blogPosts, categories } from '@/data/blog';
import Section from '@/components/Section';
import CommentSection from '@/components/CommentSection';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function BlogPostDetailPage() {
  const { slug } = useParams();
  const postSlug = Array.isArray(slug) ? slug[0] : slug;
  
  // 查找匹配的博客文章
  const post = blogPosts.find(post => post.slug === postSlug);
  
  // 如果找不到文章，返回404
  if (!post) {
    notFound();
  }
  
  // 格式化日期
  let formattedDate = post.publishedAt;
  try {
    const date = parseISO(post.publishedAt);
    if (isValid(date)) {
      formattedDate = format(date, 'MMMM d, yyyy');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
  }
  
  // 获取分类标签
  const postCategories = post.categories.map(catName => {
    const category = categories.find(c => c.name === catName);
    return {
      name: catName,
      label: category?.label.en || catName
    };
  });
  
  return (
    <>
      {/* Hero Section */}
      <Section id="blog-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary" className="py-20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <div className="flex justify-center flex-wrap gap-2 mb-4">
              {postCategories.map((category) => (
                <span
                  key={category.name}
                  className="inline-block py-1 px-3 rounded-full text-xs font-medium bg-primary-light dark:bg-dark-primary-light text-primary dark:text-dark-primary"
                >
                  {category.label}
                </span>
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
              {post.title.en}
            </h1>
            <div className="flex items-center justify-center text-neutral-dark dark:text-dark-neutral-dark">
              <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2" />
              <span>{formattedDate}</span>
            </div>
          </div>
          
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg mb-8">
            <Image
              src={post.coverImage}
              alt={post.title.en}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 800px"
              priority
            />
          </div>
        </div>
      </Section>
      
      {/* Blog Content */}
      <Section id="blog-content">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <p className="text-lg font-medium text-neutral-dark dark:text-dark-neutral-dark mb-8">
              {post.excerpt.en}
            </p>
            
            {post.content ? (
              <div dangerouslySetInnerHTML={{ __html: post.content.en }} />
            ) : (
              <div>
                <p className="mb-4">
                  This is a sample blog post content. In a real application, this would be fetched from your CMS or API.
                </p>
                <p className="mb-4">
                  You can use rich text formatting, including headings, links, code blocks, and more.
                </p>
                <p className="mb-4">
                  For demonstration purposes, only the post excerpt is available in this preview.
                </p>
              </div>
            )}
            
            <div className="my-12">
              <Link
                href="/blog"
                className="flex items-center gap-2 text-primary dark:text-dark-primary font-medium hover:underline"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                <span>Back to Blog</span>
              </Link>
            </div>
          </div>
        </div>
      </Section>
      
      {/* Author Card */}
      <Section id="author-card" bgColor="bg-neutral-light dark:bg-dark-bg-secondary" className="py-12">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row items-center bg-white dark:bg-dark-neutral-darker rounded-xl shadow-md p-6">
            <div className="w-24 h-24 relative rounded-full overflow-hidden mb-4 md:mb-0 md:mr-6">
              <Image
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                alt="Author"
                fill
                className="object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-2">
                John Doe
              </h3>
              <p className="text-neutral-dark dark:text-dark-neutral-dark mb-4">
                Full-Stack Developer & UI/UX Designer
              </p>
              <p className="text-neutral-dark dark:text-dark-neutral-dark">
                John is a passionate developer with a background in web development and design.
                He loves to share his knowledge and experience with others.
              </p>
            </div>
          </div>
              </div>
    </Section>
    
    {/* Comments Section */}
    <Section id="comments-section">
      <div className="container mx-auto max-w-4xl">
        <CommentSection postId={`post-${post.slug}`} locale="en" />
      </div>
    </Section>
  </>
);
} 