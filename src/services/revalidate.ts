/**
 * ISR 路径刷新共享 helper(feat-content-state-machine, spec §1.5)。
 *
 * /api/revalidate 路由与 /api/cron/publish 共用同一套 revalidatePath 机制,
 * cron 不经 HTTP 自调用(避免对 REVALIDATE_SECRET/部署 URL 的依赖)。
 * 仅限服务端路由上下文调用(revalidatePath 来自 next/cache)。
 */
import { revalidatePath } from 'next/cache';

export interface RevalidateResult {
  revalidated: string[];
  errors: { path: string; error: string }[];
}

/** 逐条刷新路径,单条失败隔离。 */
export function revalidatePaths(paths: string[]): RevalidateResult {
  const revalidated: string[] = [];
  const errors: { path: string; error: string }[] = [];
  for (const p of paths) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch (err: any) {
      errors.push({ path: p, error: err?.message || String(err) });
    }
  }
  return { revalidated, errors };
}

export const BLOG_BASE_PATHS = ['/blog', '/zh/blog'];

/**
 * 刷新博客相关路径:首页双语(含 LatestPosts)+ 博客双语列表 + 指定 slug 的双语详情 + sitemap。
 * 首页带 LatestPosts(getAllBlogPosts),published→draft 后不刷新会在首页 ISR 窗口内残留;
 * sitemap 为构建期缓存,不刷新则新发布/下架文章长期不反映。
 */
export function revalidateBlogPaths(slugs: string[] = []): RevalidateResult {
  const paths = new Set<string>(['/', '/zh', ...BLOG_BASE_PATHS, '/sitemap.xml']);
  for (const slug of slugs) {
    if (!slug) continue;
    paths.add(`/blog/${slug}`);
    paths.add(`/zh/blog/${slug}`);
  }
  return revalidatePaths(Array.from(paths));
}
