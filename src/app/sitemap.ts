import { MetadataRoute } from 'next';
import { getAllBlogPosts } from '@/services/notion';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.misitebo.win').replace(/\/$/, '');

  // 读取 EN/ZH 博客
  const [enPosts, zhPosts] = await Promise.all([
    getAllBlogPosts({ language: 'English' }),
    getAllBlogPosts({ language: 'Chinese' }),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now },
    { url: `${siteUrl}/blog`, lastModified: now },
    { url: `${siteUrl}/zh/blog`, lastModified: now },
  ];

  const mapPosts = (posts: any[], prefix: '/blog' | '/zh/blog'): MetadataRoute.Sitemap => {
    return posts.map((p: any) => ({
      url: `${siteUrl}${prefix}/${p.slug}`,
      lastModified: new Date(p.lastEditedTime || p.date || now),
    }));
  };

  return [
    ...staticRoutes,
    ...mapPosts(enPosts || [], '/blog'),
    ...mapPosts(zhPosts || [], '/zh/blog'),
  ];
}