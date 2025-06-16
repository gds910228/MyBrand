"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format, isValid, parseISO } from 'date-fns';
import { blogPosts, categories } from '@/data/blog';
import Section from '@/components/Section';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function BlogPostDetailPageZh() {
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
      formattedDate = format(date, 'yyyy年MM月dd日');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
  }
  
  // 获取分类标签
  const postCategories = post.categories.map(catName => {
    const category = categories.find(c => c.name === catName);
    return {
      name: catName,
      label: category?.label.zh || catName
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
              {post.title.zh}
            </h1>
            <div className="flex items-center justify-center text-neutral-dark dark:text-dark-neutral-dark">
              <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2" />
              <span>{formattedDate}</span>
            </div>
          </div>
          
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg mb-8">
            <Image
              src={post.coverImage}
              alt={post.title.zh}
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
              {post.excerpt.zh}
            </p>
            
            {post.content ? (
              <div dangerouslySetInnerHTML={{ __html: post.content.zh }} />
            ) : (
              <div>
                <p className="mb-4">
                  这是示例博客文章内容。在实际应用中，内容将从您的CMS或API获取。
                </p>
                <p className="mb-4">
                  您可以使用富文本格式，包括标题、链接、代码块等。
                </p>
                <p className="mb-4">
                  出于演示目的，此预览中仅提供文章摘要。
                </p>
              </div>
            )}
            
            <div className="my-12">
              <Link
                href="/zh/blog"
                className="flex items-center gap-2 text-primary dark:text-dark-primary font-medium hover:underline"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                <span>返回博客列表</span>
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
                alt="作者"
                fill
                className="object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-2">
                张三
              </h3>
              <p className="text-neutral-dark dark:text-dark-neutral-dark mb-4">
                全栈开发者 & UI/UX设计师
              </p>
              <p className="text-neutral-dark dark:text-dark-neutral-dark">
                张三是一位热情的开发者，拥有网页开发和设计背景。他喜欢与他人分享知识和经验。
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
} 