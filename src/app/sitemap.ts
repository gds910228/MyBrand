import { MetadataRoute } from 'next';
import { getAllBlogPosts } from '@/services/notion';
import { projectsDataEn, projectsDataZh } from '@/data/projects';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.misitebo.win').replace(/\/$/, '');

  // 读取 EN/ZH 博客
  const [enPosts, zhPosts] = await Promise.all([
    getAllBlogPosts({ language: 'English' }),
    getAllBlogPosts({ language: 'Chinese' }),
  ]);

  const now = new Date();

  // 静态页面路由
  const staticRoutes: MetadataRoute.Sitemap = [
    { 
      url: `${siteUrl}/`, 
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0
    },
    { 
      url: `${siteUrl}/blog`, 
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9
    },
    { 
      url: `${siteUrl}/zh/blog`, 
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9
    },
    { 
      url: `${siteUrl}/projects`, 
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8
    },
    { 
      url: `${siteUrl}/zh/projects`, 
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8
    },
    { 
      url: `${siteUrl}/contact`, 
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7
    },
    { 
      url: `${siteUrl}/zh/contact`, 
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7
    },
    { 
      url: `${siteUrl}/zh`, 
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9
    }
  ];

  // 博客文章路由
  const mapPosts = (posts: any[], prefix: '/blog' | '/zh/blog'): MetadataRoute.Sitemap => {
    return posts.map((p: any) => ({
      url: `${siteUrl}${prefix}/${p.slug}`,
      lastModified: new Date(p.lastEditedTime || p.date || now),
      changeFrequency: 'monthly' as const,
      priority: 0.6
    }));
  };

  // 项目页面路由
  const projectRoutes: MetadataRoute.Sitemap = [
    ...projectsDataEn.map(project => ({
      url: `${siteUrl}/projects/${project.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7
    })),
    ...projectsDataZh.map(project => ({
      url: `${siteUrl}/zh/projects/${project.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7
    }))
  ];

  return [
    ...staticRoutes,
    ...mapPosts(enPosts || [], '/blog'),
    ...mapPosts(zhPosts || [], '/zh/blog'),
    ...projectRoutes,
  ];
}
