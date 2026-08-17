/**
 * 内容状态服务层(feat-content-state-machine, spec §1.1)。
 *
 * 独立于 notion.ts(该文件已 ~2000 行,按编码规范拆分新领域文件):
 * - 自建 Notion Client(Client 无状态,多实例无副作用);
 * - 写操作成功后调 invalidateBlogListCache() 失效 notion.ts 内的列表缓存;
 * - 读侧全量拉取后由 src/lib/contentStatus.ts 归一化(大小写不敏感、缺值兜底);
 * - 未配置 NOTION_API_KEY / NOTION_BLOG_DATABASE_ID 时优雅降级,不抛错。
 */
import { Client } from '@notionhq/client';
import { invalidateBlogListCache } from './notion';
import {
  ContentStatus,
  isValidContentStatus,
  isValidISODate,
  normalizeStatus,
  toNotionStatusName,
} from '@/lib/contentStatus';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const BLOG_DATABASE_ID = process.env.NOTION_BLOG_DATABASE_ID || '';

/** 后台列表项(状态已归一化为小写枚举)。 */
export interface AdminPostItem {
  id: string;
  slug: string;
  title: string;
  status: ContentStatus;
  scheduledAt: string | null;
  createdAt: string;
  date: string;
  language?: string;
}

export type ContentStatusResult<T> =
  | { ok: true; data: T }
  | { ok: false; skipped?: boolean; error: string };

function notionNotConfigured<T>(): ContentStatusResult<T> {
  return { ok: false, skipped: true, error: 'notion-not-configured' };
}

function deriveSlug(props: any, title: string): string {
  return (
    props?.slug?.rich_text?.[0]?.plain_text ||
    props?.Slug?.rich_text?.[0]?.plain_text ||
    title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  );
}

function mapPageToAdminItem(page: any): AdminPostItem {
  const props = page.properties || {};
  const title = props.Title?.title?.[0]?.plain_text || 'Untitled';
  return {
    id: page.id,
    slug: deriveSlug(props, title),
    title,
    status: normalizeStatus(props.Status?.select?.name),
    scheduledAt: props.scheduledAt?.date?.start || null,
    createdAt: page.created_time,
    date: props.PublishDate?.date?.start || page.created_time,
    language: props.Language?.select?.name || undefined,
  };
}

/** 拉取博客库全部页面(无状态过滤),供后台/cron 使用。 */
async function queryAllBlogPages(): Promise<any[]> {
  const all: any[] = [];
  let cursor: string | undefined;
  do {
    const res: any = await notion.databases.query({
      database_id: BLOG_DATABASE_ID,
      sorts: [{ property: 'PublishDate', direction: 'descending' }],
      page_size: 100,
      start_cursor: cursor,
    });
    all.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return all;
}

/**
 * 后台用:列出全部文章(含 draft/scheduled/published)。
 * 未配置 Notion 时返回空数组(与 listSubscribers 降级风格一致)。
 */
export async function listAllBlogPostsWithStatus(options?: {
  language?: string;
}): Promise<AdminPostItem[]> {
  if (!process.env.NOTION_API_KEY || !BLOG_DATABASE_ID) return [];
  try {
    const pages = await queryAllBlogPages();
    let items = pages.map(mapPageToAdminItem);
    if (options?.language) {
      items = items.filter((p) => p.language === options.language);
    }
    return items;
  } catch (error: any) {
    console.error('[listAllBlogPostsWithStatus] Error:', error?.message || error);
    return [];
  }
}

/** 后台/预览用:按 slug 取单篇(不限状态)。 */
export async function getPostBySlugWithStatus(
  slug: string,
): Promise<AdminPostItem | null> {
  if (!process.env.NOTION_API_KEY || !BLOG_DATABASE_ID || !slug) return null;
  try {
    const res: any = await notion.databases.query({
      database_id: BLOG_DATABASE_ID,
      filter: { property: 'Slug', rich_text: { equals: slug } },
      page_size: 1,
    });
    if (res.results.length > 0) return mapPageToAdminItem(res.results[0]);
    // 兜底:Slug 字段为空的文章按标题派生 slug 匹配
    const all = (await queryAllBlogPages()).map(mapPageToAdminItem);
    return all.find((p) => p.slug === slug) || null;
  } catch (error: any) {
    console.error('[getPostBySlugWithStatus] Error:', error?.message || error);
    return null;
  }
}

/**
 * 状态流转:写 Notion Status select(规范名 Draft/Scheduled/Published)。
 * 成功返回更新后的 slug(供路由层 revalidate 用)。
 */
export async function setStatus(
  id: string,
  status: ContentStatus,
): Promise<ContentStatusResult<{ slug: string }>> {
  if (!process.env.NOTION_API_KEY || !BLOG_DATABASE_ID) return notionNotConfigured();
  if (!id) return { ok: false, error: 'missing-id' };
  if (!isValidContentStatus(status)) return { ok: false, error: 'invalid-status' };
  try {
    const updated: any = await notion.pages.update({
      page_id: id,
      properties: { Status: { select: { name: toNotionStatusName(status) } } },
    });
    invalidateBlogListCache();
    const props = updated?.properties || {};
    const title = props.Title?.title?.[0]?.plain_text || 'Untitled';
    return { ok: true, data: { slug: deriveSlug(props, title) } };
  } catch (error: any) {
    console.error('[setStatus] Error:', error?.message || error);
    return { ok: false, error: error?.message || 'Unknown error' };
  }
}

/**
 * 设置/清除定时发布时间。iso 为 null 时清除。
 * scheduledAt 字段不存在时返回稳定错误码 'scheduledAt-field-missing'(防空降级)。
 */
export async function setScheduledAt(
  id: string,
  iso: string | null,
): Promise<ContentStatusResult<{ scheduledAt: string | null }>> {
  if (!process.env.NOTION_API_KEY || !BLOG_DATABASE_ID) return notionNotConfigured();
  if (!id) return { ok: false, error: 'missing-id' };
  if (iso !== null && !isValidISODate(iso)) return { ok: false, error: 'invalid-date' };
  try {
    await notion.pages.update({
      page_id: id,
      properties: {
        scheduledAt: iso === null ? { date: null } : { date: { start: iso } },
      },
    });
    invalidateBlogListCache();
    return { ok: true, data: { scheduledAt: iso } };
  } catch (error: any) {
    const message: string = error?.message || 'Unknown error';
    console.error('[setScheduledAt] Error:', message);
    if (message.includes('scheduledAt')) {
      return { ok: false, error: 'scheduledAt-field-missing' };
    }
    return { ok: false, error: message };
  }
}

/** cron 用:列出原始候选(id/slug/status/scheduledAt),由 lib 层筛选到期。 */
export async function listScheduledPostsRaw(): Promise<
  { id: string; slug: string; status: ContentStatus; scheduledAt: string | null }[]
> {
  const items = await listAllBlogPostsWithStatus();
  return items
    .filter((p) => p.status === 'scheduled')
    .map((p) => ({ id: p.id, slug: p.slug, status: p.status, scheduledAt: p.scheduledAt }));
}
