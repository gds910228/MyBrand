export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Image from 'next/image';
import FallbackImage from '@/components/FallbackImage';
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

// 生成静态参数
export async function generateStaticParams() {
  const posts = await getAllBlogPosts({ language: 'English' });
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// 生成元数据
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const posts = await getAllBlogPosts({ language: 'English' });
  const post = posts.find(p => p.slug === params.slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
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
      modifiedTime: (post as any).lastEditedTime,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

// 博客文章详情页面
export default async function BlogPostDetailPage({ params }: { params: { slug: string } }) {
  try {
    console.log(`[BlogPost] Loading post with slug: ${params.slug}`);

    const posts = await getAllBlogPosts({ language: 'English' });
    const post = posts.find(p => p.slug === params.slug);

    if (!post) {
      console.log(`[BlogPost] Post not found with slug: ${params.slug}`);
      redirect('/blog');
    }

    console.log(`[BlogPost] Found post: ${post.title}, fetching full content...`);

    // 获取完整的博客文章内容
    const fullPost = await getBlogPostById(post.id);

    if (!fullPost) {
      console.log(`[BlogPost] Full post content not found for ID: ${post.id}`);
      notFound();
    }

    console.log(`[BlogPost] Successfully loaded full post content`);

    // 格式化日期
    const formattedDate = format(new Date(fullPost.date), 'MMMM d, yyyy');

    // JSON-LD for SEO
    const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: fullPost.title,
    image: fullPost.coverImage ? [fullPost.coverImage] : undefined,
    datePublished: fullPost.date,
    dateModified: (fullPost as any).lastEditedTime,
    author: fullPost.author ? [{ "@type": "Person", name: fullPost.author }] : undefined,
    inLanguage: "en",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/blog/${(fullPost as any).slug ?? params.slug}`,
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
  
  // 渲染Notion内容
  
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
          {coverSrc && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg mb-8">
              <FallbackImage
                src={coverSrc}
                alt={fullPost.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 800px"
                priority
                onError={(e) => {
                  console.error('Cover image failed to load:', coverSrc, e);
                }}
              />
            </div>
          )}
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

          {/* Tool info and ratings */}
          <ToolInfoBox
            website={(fullPost as any).toolWebsite}
            pricing={(fullPost as any).toolPricing}
            locale="en"
          />
          <ReviewRating
            overall={(fullPost as any).ratingOverall}
            easeOfUse={(fullPost as any).ratingEase}
            features={(fullPost as any).ratingFeatures}
            locale="en"
          />
          <ProsCons
            pros={(fullPost as any).pros}
            cons={(fullPost as any).cons}
            locale="en"
          />

          {(fullPost as any).comparisonColumns && (fullPost as any).comparisonData && (
            <div className="my-8">
              <ComparisonTable
                columns={(fullPost as any).comparisonColumns}
                data={(fullPost as any).comparisonData}
                locale="en"
                highlightWinners
                initialSortKey={((fullPost as any).comparisonColumns[0]?.key) ?? undefined}
                initialSortDir="desc"
              />
            </div>
          )}

          <NotionRenderer blocks={fullPost.content} className="prose prose-lg dark:prose-invert max-w-none" />
          
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
      </Section>
      
      
      {/* Comments Section */}
      <Section id="comments-section">
        <div className="container mx-auto max-w-4xl">
          <CommentSection postId={(fullPost as any).slug || params.slug} locale="en" />
        </div>
      </Section>
    </>
  );
  } catch (error) {
    console.error(`[BlogPost] Error loading blog post ${params.slug}:`, error);

    // 返回错误页面或重定向
    return (
      <Section>
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
          <p className="text-neutral-dark dark:text-dark-neutral-dark mb-8">
            We couldn't load this blog post. Please try again later or go back to the blog.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-primary dark:text-dark-primary font-medium hover:underline"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
            <span>Back to Blog</span>
          </Link>
        </div>
      </Section>
    );
  }
}