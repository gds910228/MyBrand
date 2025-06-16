"use client";

import React from 'react';
import Section from './Section';
import SectionHeading from './SectionHeading';
import BlogCard from './BlogCard';
import Button from './Button';

// Mock data (in a real app, this would come from Notion API)
const latestPosts = [
  {
    id: '1',
    title: 'How to Build a Responsive Website with Tailwind CSS',
    excerpt: 'Learn how to create a fully responsive website using Tailwind CSS, a utility-first CSS framework that makes styling easy and maintainable.',
    date: '2023-06-15',
    imageSrc: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    imageAlt: 'Person coding on a laptop',
    slug: 'how-to-build-responsive-website-tailwind-css',
    tags: ['Tailwind CSS', 'Responsive Design'],
    readTime: '5 min read',
  },
  {
    id: '2',
    title: 'The Future of Web Development: What to Expect in 2024',
    excerpt: 'Explore the upcoming trends and technologies that will shape the future of web development in the coming year.',
    date: '2023-05-28',
    imageSrc: 'https://images.unsplash.com/photo-1581276879432-15e50529f34b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    imageAlt: 'Futuristic technology concept',
    slug: 'future-web-development-2024',
    tags: ['Web Development', 'Trends'],
    readTime: '7 min read',
  },
  {
    id: '3',
    title: 'Optimizing Performance in React Applications',
    excerpt: 'Discover practical techniques to improve the performance of your React applications, from code splitting to memoization.',
    date: '2023-05-10',
    imageSrc: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    imageAlt: 'Dashboard with performance metrics',
    slug: 'optimizing-performance-react-applications',
    tags: ['React', 'Performance'],
    readTime: '6 min read',
  },
];

const LatestPosts: React.FC = () => {
  return (
    <Section id="latest-posts" bgColor="bg-neutral-light">
      <SectionHeading
        title="Latest Articles"
        subtitle="Read my latest thoughts, tutorials, and insights on web development and design."
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {latestPosts.map((post) => (
          <BlogCard
            key={post.id}
            title={post.title}
            excerpt={post.excerpt}
            date={post.date}
            imageSrc={post.imageSrc}
            imageAlt={post.imageAlt}
            href={`/blog/${post.slug}`}
            tags={post.tags}
            readTime={post.readTime}
          />
        ))}
      </div>
      
      <div className="mt-8 sm:mt-10 md:mt-12 text-center">
        <Button href="/blog" variant="outline">
          View All Articles
        </Button>
      </div>
    </Section>
  );
};

export default LatestPosts; 