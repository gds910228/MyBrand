export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Image from 'next/image';
import BlogCoverImage from '@/components/BlogCoverImage';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faArrowLeft, faTags, faUser } from '@fortawesome/free-solid-svg-icons';
import Section from '@/components/Section';
import CommentSection from '@/components/CommentSection';
import { getAllBlogPosts, getBlogPostById } from '@/services/notion';
import NotionRenderer from '@/components/NotionRenderer';
import ReviewRating from '@/components/ReviewRating';
import ProsCons from '@/components/ProsCons';
import ToolInfoBox from '@/components/ToolInfoBox';
import ComparisonTable from '@/components/ComparisonTable';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 生成静态参数
export async function generateStaticParams() {
  const posts = await getAllBlogPosts({ language: 'Chinese' });
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// 生成元数据
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const posts = await getAllBlogPosts({ language: 'Chinese' });
  const post = posts.find(p => p.slug === params.slug);
  
  if (!post) {
    return {
      title: '文章未找到',
    };
  }
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      type: 'article',
      publishedTime: (post as any).createdTime,
      modifiedTime: post.lastEditedTime,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

// 博客文章详情页面（中文）
export default async function BlogPostDetailPageZh({ params }: { params: { slug: string } }) {
  const posts = await getAllBlogPosts({ language: 'Chinese' });
  const post = posts.find(p => p.slug === params.slug);
  
  if (!post) {
    redirect('/zh/blog');
  }
  
  // 获取完整的博客文章内容
  const fullPost = await getBlogPostById(post.id);
  
  if (!fullPost) {
    notFound();
  }
  
  // 格式化日期（中文）
  const formattedDate = format(new Date(fullPost.date), 'yyyy年MM月dd日', { locale: zhCN });

  // JSON-LD for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: fullPost.title,
    image: fullPost.coverImage ? [fullPost.coverImage] : undefined,
    datePublished: fullPost.date,
    dateModified: (fullPost as any).lastEditedTime,
    author: fullPost.author ? [{ "@type": "Person", name: fullPost.author }] : undefined,
    inLanguage: "zh",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/zh/blog/${(fullPost as any).slug ?? params.slug}`,
    articleSection: (fullPost.tags ?? []),
    description: fullPost.excerpt,
    ...(((fullPost as any).ratingOverall && (fullPost as any).ratingOverall > 0) ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (fullPost as any).ratingOverall,
        ratingCount: 1,
        bestRating: 5,
        worstRating: 0
      }
    } : {})
  };
  
  // Cover fallback
  const coverSrc = fullPost.coverImage || '/images/covers/placeholder.svg';
  
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero Section */}
      <Section id="blog-hero" bgColor="bg-neutral-light dark:bg-dark-bg-secondary" className="py-20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            {/* Tags */}
            {fullPost.tags && fullPost.tags.length > 0 && (
              <div className="flex justify-center flex-wrap gap-2 mb-4">
                {fullPost.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-block py-1 px-3 rounded-full text-xs font-medium bg-primary-light dark:bg-dark-primary-light text-primary dark:text-dark-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-neutral-darker dark:text-dark-neutral-darker mb-4">
              {fullPost.title}
            </h1>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-neutral-dark dark:text-dark-neutral-dark">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
              
              {fullPost.author && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                  <span>{fullPost.author}</span>
                </div>
              )}
              
              {fullPost.readTime && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faTags} className="w-4 h-4" />
                  <span>{fullPost.readTime}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Cover Image */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg mb-8">
            <BlogCoverImage
              src={coverSrc}
              alt={fullPost.title}
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
          {fullPost.excerpt && (
            <p className="text-lg font-medium text-neutral-dark dark:text-dark-neutral-dark mb-8">
              {fullPost.excerpt}
            </p>
          )}

          {/* 工具信息与评分模块 */}
          <ToolInfoBox
            website={(fullPost as any).toolWebsite}
            pricing={(fullPost as any).toolPricing}
            locale="zh"
          />
          <ReviewRating
            overall={(fullPost as any).ratingOverall}
            easeOfUse={(fullPost as any).ratingEase}
            features={(fullPost as any).ratingFeatures}
            locale="zh"
          />
          <ProsCons
            pros={(fullPost as any).pros}
            cons={(fullPost as any).cons}
            locale="zh"
          />
          
          {(fullPost as any).comparisonColumns && (fullPost as any).comparisonData && (
            <div className="my-8">
              <ComparisonTable
                columns={(fullPost as any).comparisonColumns}
                data={(fullPost as any).comparisonData}
                locale="zh"
                highlightWinners
                initialSortKey={((fullPost as any).comparisonColumns[0]?.key) ?? undefined}
                initialSortDir="desc"
              />
            </div>
          )}

          <NotionRenderer blocks={fullPost.content} className="prose prose-lg dark:prose-invert max-w-none" />
          
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
      </Section>
      
      
      {/* Comments Section */}
      <Section id="comments-section">
        <div className="container mx-auto max-w-4xl">
          <CommentSection postId={(fullPost as any).slug || params.slug} locale="zh" />
        </div>
      </Section>
    </>
  );
}