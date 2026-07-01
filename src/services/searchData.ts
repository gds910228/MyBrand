import { getAllBlogPosts, getAllProjects } from '@/services/notion';
import { localeToLanguage, type SearchDoc } from '@/lib/searchIndex';
import type { Locale } from '@/i18n/locales';

/**
 * 构建站内搜索文档集（博客 + 项目），供 `/api/search/index`（客户端索引）
 * 与 `/api/search`（服务端兜底）复用，保证两端搜索口径一致。
 *
 * 与旧实现的关键区别：
 * - 旧 `/api/search` 会对前 10 篇博客逐篇 `getBlogPostById` 拉全文（N+1，慢）。
 * - 这里只用列表接口已有的元数据（title/excerpt/tags/technologies），零额外回源，
 *   交给 MiniSearch 做相关性排序与模糊匹配，索引也保持精简。
 */
export async function getSearchDocuments(locale: Locale): Promise<SearchDoc[]> {
  const language = localeToLanguage(locale);

  const [postsResult, projectsResult] = await Promise.allSettled([
    getAllBlogPosts({ language }),
    getAllProjects({ language }),
  ]);

  const blogPosts =
    postsResult.status === 'fulfilled' && Array.isArray(postsResult.value)
      ? postsResult.value
      : [];
  const projects =
    projectsResult.status === 'fulfilled' && Array.isArray(projectsResult.value)
      ? projectsResult.value
      : [];

  if (postsResult.status === 'rejected') {
    console.error('[searchData] failed to load blog posts:', postsResult.reason);
  }
  if (projectsResult.status === 'rejected') {
    console.error('[searchData] failed to load projects:', projectsResult.reason);
  }

  const docs: SearchDoc[] = [];

  for (const post of blogPosts as any[]) {
    if (!post?.id || !post?.slug) continue;
    docs.push({
      id: `blog:${post.id}`,
      type: 'blog',
      refId: post.id,
      slug: post.slug,
      title: post.title || 'Untitled',
      excerpt: post.excerpt || '',
      keywords: Array.isArray(post.tags) ? post.tags.filter(Boolean) : [],
      date: post.date || post.lastEditedTime || new Date(0).toISOString(),
      readTime: post.readTime || undefined,
      language: post.language || undefined,
    });
  }

  for (const project of projects as any[]) {
    if (!project?.id || !project?.slug) continue;
    docs.push({
      id: `project:${project.id}`,
      type: 'project',
      refId: project.id,
      slug: project.slug,
      title: project.title || 'Untitled',
      excerpt: project.description || project.subtitle || '',
      keywords: Array.isArray(project.technologies) ? project.technologies.filter(Boolean) : [],
      date: project.date || project.createdTime || new Date(0).toISOString(),
      language: project.language || undefined,
    });
  }

  // 按当前语言过滤：保留匹配当前语言的内容 + 未标注语言的中性内容（如跨语言的技术类项目）；
  // 两种语言互斥标注的内容不再交叉出现，保持与站内博客/项目列表一致的语言口径。
  return docs.filter((d) => !d.language || d.language === language);
}
