import { Client } from '@notionhq/client';
import crypto from 'crypto';

/**
 * 验证和清理图片URL
 * - 确保URL格式正确
 * - 检查是否为有效的图片URL
 * - 处理AWS签名URL的特殊情况
 */
function validateImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return '';

  // 检查是否是有效的URL格式
  try {
    new URL(trimmedUrl);
  } catch {
    return '';
  }

  // 检查是否是图片URL或已知的图片托管服务
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
  const isImageUrl = imageExtensions.some(ext =>
    trimmedUrl.toLowerCase().includes(ext)
  ) ||
  trimmedUrl.includes('amazonaws.com') || // Notion/AWS S3图片
  trimmedUrl.includes('unsplash.com') ||   // Unsplash图片
  trimmedUrl.includes('ytimg.com') ||      // YouTube图片
  trimmedUrl.includes('images.unsplash.com'); // Unsplash代理图片

  return isImageUrl ? trimmedUrl : '';
}

// 评论类型定义
export interface CommentType {
  id: string;
  postId: string;
  parentId: string | null;
  author: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  content: string;
  createdAt: string;
  replies?: CommentType[];
}

// 初始化Notion客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// 数据库ID
const PROJECTS_DATABASE_ID = process.env.NOTION_PROJECTS_DATABASE_ID || '';
const BLOG_DATABASE_ID = process.env.NOTION_BLOG_DATABASE_ID || '';
const ABOUT_PAGE_ID = process.env.NOTION_ABOUT_PAGE_ID || '';

// 博客页面父页面ID（用于获取所有博客页面）
const BLOG_PARENT_PAGE_ID = process.env.NOTION_BLOG_PARENT_PAGE_ID || '';

// 评论数据库ID - 添加连字符以匹配Notion API期望的格式
const COMMENTS_DATABASE_ID = process.env.NOTION_COMMENTS_DATABASE_ID
  ? process.env.NOTION_COMMENTS_DATABASE_ID.replace(/^(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})$/, '$1-$2-$3-$4-$5')
  : '';

// 询价数据库ID - 同样规范化连字符
const INQUIRIES_DATABASE_ID = process.env.NOTION_INQUIRIES_DATABASE_ID
  ? process.env.NOTION_INQUIRIES_DATABASE_ID.replace(/^(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})$/, '$1-$2-$3-$4-$5')
  : '';

// 订阅数据库 ID（邮件订阅 + Web Push，角度2）。复用同一连字符规范化。
const SUBSCRIBERS_DATABASE_ID = process.env.NOTION_SUBSCRIBERS_DATABASE_ID
  ? process.env.NOTION_SUBSCRIBERS_DATABASE_ID.replace(/^(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})$/, '$1-$2-$3-$4-$5')
  : '';

 // 简易缓存（内存，默认60秒）
const BLOG_LIST_CACHE_TTL_MS = process.env.DISABLE_NOTION_CACHE ? 0 : 60 * 1000;
const blogListCache = new Map<string, { data: any[]; expiry: number }>();

 // 数据库字段探测缓存：是否存在 Language 属性
let blogDbHasLanguageProp: boolean | null = null;
// Projects 数据库字段探测缓存：是否存在 Language 属性
let projectsDbHasLanguageProp: boolean | null = null;

// Notion评论页面类型
interface NotionCommentPage {
  properties: {
    name: { title: Array<{ plain_text: string }> };
    email: { email: string };
    content: { rich_text: Array<{ plain_text: string }> };
    createdAt: { date: { start: string } | null };
    postId: { rich_text: Array<{ plain_text: string }> };
    parentId: { rich_text: Array<{ plain_text: string }> };
  };
}

// 本地评论存储
let localComments: CommentType[] = [
  {
    id: 'comment-1',
    postId: 'post-getting-started-with-nextjs-14',
    parentId: null,
    author: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80'
    },
    content: 'Great article! I\'ve been trying to learn Next.js and this was very helpful.',
    createdAt: '2023-10-26T08:30:00Z',
  },
  {
    id: 'comment-2',
    postId: 'post-getting-started-with-nextjs-14',
    parentId: 'comment-1',
    author: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80'
    },
    content: 'Thanks Alice! I\'m glad you found it useful. Let me know if you have any questions.',
    createdAt: '2023-10-26T09:15:00Z',
  },
  {
    id: 'comment-3',
    postId: 'post-getting-started-with-nextjs-14',
    parentId: null,
    author: {
      name: 'Robert Smith',
      email: 'robert@example.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80'
    },
    content: 'I\'m still confused about the App Router. Could you explain more about how it differs from the Pages Router?',
    createdAt: '2023-10-27T10:45:00Z',
  }
];

/**
 * 获取所有项目
 */
export async function getAllProjects(options?: { language?: string; limit?: number }) {
  try {
    // 探测 Projects 数据库是否存在 Language 字段
    if (projectsDbHasLanguageProp === null) {
      try {
        const dbMeta: any = await notion.databases.retrieve({ database_id: PROJECTS_DATABASE_ID });
        projectsDbHasLanguageProp = !!dbMeta?.properties?.Language;
      } catch {
        projectsDbHasLanguageProp = false;
      }
    }

    const includeLanguageFilter = !!(options?.language && projectsDbHasLanguageProp);

    const filters: any[] = [
      { property: 'Status', select: { equals: 'Published' } },
    ];
    if (includeLanguageFilter) {
      filters.push({
        or: [
          { property: 'Language', select: { equals: options!.language! } },
          { property: 'Language', select: { is_empty: true } }
        ]
      } as any);
    }

    const response = await notion.databases.query({
      database_id: PROJECTS_DATABASE_ID,
      filter: filters.length > 1 ? { and: filters } : filters[0],
      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
      page_size: options?.limit || 100, // 默认最多100条
    });

    return response.results.map((page: any) => {
      const props = (page as any).properties || {};

      // 标题
      const title = props.Title?.title?.[0]?.plain_text || 'Untitled';
      // 副标题
      const subtitle =
        props.Subtitle?.rich_text?.[0]?.plain_text ||
        '';
      // 描述
      const description = props.Description?.rich_text?.[0]?.plain_text || '';

      // 封面（与 Blog 对齐的回退策略）
      let coverImage = '';
      if ((page as any).cover) {
        if ((page as any).cover.type === 'external') {
          coverImage = validateImageUrl((page as any).cover.external.url);
        } else if ((page as any).cover.type === 'file') {
          coverImage = validateImageUrl((page as any).cover.file.url);
        }
      }
      if (!coverImage && props.CoverImage?.files?.[0]) {
        const f = props.CoverImage.files[0];
        coverImage = validateImageUrl(f?.file?.url || f?.external?.url || '');
      }
      if (!coverImage) {
        const coverText =
          props.CoverImage?.rich_text?.[0]?.plain_text ||
          props.CoverImageUrl?.url ||
          props.CoverImageUrl?.rich_text?.[0]?.plain_text ||
          props.Coverlmage?.rich_text?.[0]?.plain_text || // 兼容误拼
          '';
        if (coverText) {
          if (/^https?:\/\//i.test(coverText)) {
            coverImage = validateImageUrl(coverText);
          } else {
            coverImage = `/images/covers/${coverText}`;
          }
        }
      }

      // 缩略图（若有）
      const thumbnail =
        props.Thumbnail?.files?.[0]?.file?.url ||
        props.Thumbnail?.files?.[0]?.external?.url ||
        '';

      // 标签与分类
      const technologies = props.Technologies?.multi_select?.map((t: any) => t.name) || [];
      const category = props.Category?.select?.name || undefined;
      const role = props.Role?.select?.name || '';
      const year =
        props.Year?.select?.name ||
        (typeof props.Year?.number === 'number' ? String(props.Year.number) : '') ||
        '';

      // 链接与精选
      const featured = !!props.Featured?.checkbox;
      const projectUrl = props.ProjectUrl?.url || '';
      const githubUrl = props.GitHubUrl?.url || props.GithubUrl?.url || '';

      // slug
      const rawSlug =
        props.slug?.rich_text?.[0]?.plain_text ||
        props.Slug?.rich_text?.[0]?.plain_text ||
        '';
      const slug =
        rawSlug ||
        title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      // 语言（可选）
      const language = props.Language?.select?.name || undefined;
      const client = props.Client?.rich_text?.[0]?.plain_text || '';

      return {
        id: page.id,
        title,
        subtitle,
        description,
        coverImage: coverImage || thumbnail || '',
        thumbnail,
        technologies,
        category,
        role,
        year,
        featured,
        projectUrl,
        githubUrl,
        slug,
        language,
        client,
      };
    });
  } catch (error) {
    console.error('Error fetching projects from Notion:', error);
    return [];
  }
}

/**
 * 获取项目详情
 */
export async function getProjectById(id: string) {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    // 内容块（简单列表，若需完整分页可按 Blog 的实现递归拉取）
    const blocks = await notion.blocks.children.list({ block_id: id });

    const pageAny = page as any;
    const props = pageAny.properties || {};

    // 标题/副标题/描述
    const title = props.Title?.title?.[0]?.plain_text || 'Untitled';
    const subtitle = props.Subtitle?.rich_text?.[0]?.plain_text || '';
    const description = props.Description?.rich_text?.[0]?.plain_text || '';

    // 封面解析（与 Blog 一致）
    let coverImage = '';
    if (pageAny.cover) {
      if (pageAny.cover.type === 'external') {
        coverImage = validateImageUrl(pageAny.cover.external.url);
      } else if (pageAny.cover.type === 'file') {
        coverImage = validateImageUrl(pageAny.cover.file.url);
      }
    }
    if (!coverImage && props.CoverImage?.files?.[0]) {
      const f = props.CoverImage.files[0];
      coverImage = validateImageUrl(f?.file?.url || f?.external?.url || '');
    }
    if (!coverImage) {
      const coverText =
        props.CoverImage?.rich_text?.[0]?.plain_text ||
        props.CoverImageUrl?.url ||
        props.CoverImageUrl?.rich_text?.[0]?.plain_text ||
        props.Coverlmage?.rich_text?.[0]?.plain_text ||
        '';
      if (coverText) {
        if (/^https?:\/\//i.test(coverText)) {
          coverImage = coverText;
        } else {
          coverImage = `/images/covers/${coverText}`;
        }
      }
    }

    const thumbnail =
      props.Thumbnail?.files?.[0]?.file?.url ||
      props.Thumbnail?.files?.[0]?.external?.url ||
      '';

    const technologies = props.Technologies?.multi_select?.map((t: any) => t.name) || [];
    const category = props.Category?.select?.name || undefined;
    const role = props.Role?.select?.name || '';
    const year =
      props.Year?.select?.name ||
      (typeof props.Year?.number === 'number' ? String(props.Year.number) : '') ||
      '';

    const featured = !!props.Featured?.checkbox;
    const projectUrl = props.ProjectUrl?.url || '';
    const githubUrl = props.GitHubUrl?.url || props.GithubUrl?.url || '';

    const rawSlug =
      props.slug?.rich_text?.[0]?.plain_text ||
      props.Slug?.rich_text?.[0]?.plain_text ||
      '';
    const slug =
      rawSlug ||
      title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const language = props.Language?.select?.name || undefined;

    const client = props.Client?.rich_text?.[0]?.plain_text || '';
    const responsibilities =
      props.Responsibilities?.rich_text?.[0]?.plain_text?.split('\n') || [];

    return {
      id: page.id,
      title,
      subtitle,
      description,
      coverImage: coverImage || thumbnail || '',
      thumbnail,
      technologies,
      category,
      role,
      year,
      featured,
      projectUrl,
      githubUrl,
      slug,
      language,
      client,
      responsibilities,
      content: blocks.results,
    };
  } catch (error) {
    console.error('Error fetching project from Notion:', error);
    return null;
  }
}

/**
 * 通过 slug 获取项目详情（支持可选语言过滤）
 */
export async function getProjectBySlug(slug: string, options?: { language?: string }) {
  try {
    // 探测 Projects 数据库是否存在 Language 字段
    if (projectsDbHasLanguageProp === null) {
      try {
        const dbMeta: any = await notion.databases.retrieve({ database_id: PROJECTS_DATABASE_ID });
        projectsDbHasLanguageProp = !!dbMeta?.properties?.Language;
      } catch {
        projectsDbHasLanguageProp = false;
      }
    }

    const includeLanguageFilter = !!(options?.language && projectsDbHasLanguageProp);

    const filters: any[] = [
      { property: 'Status', select: { equals: 'Published' } },
      { property: 'Slug', rich_text: { equals: slug } },
    ];
    if (includeLanguageFilter) {
      filters.push({
        or: [
          { property: 'Language', select: { equals: options!.language! } },
          { property: 'Language', select: { is_empty: true } }
        ]
      } as any);
    }

    const query = await notion.databases.query({
      database_id: PROJECTS_DATABASE_ID,
      filter: { and: filters },
      page_size: 1,
    });

    let page: any;
    if (query.results.length) {
      page = query.results[0];
    } else {
      // Fallback: list candidates and match by generated slug from Title when Slug is missing
      const baseFilters: any[] = [
        { property: 'Status', select: { equals: 'Published' } },
      ];
      if (includeLanguageFilter) {
        baseFilters.push({
          or: [
            { property: 'Language', select: { equals: options!.language! } },
            { property: 'Language', select: { is_empty: true } }
          ]
        } as any);
      }
      const listRes = await notion.databases.query({
        database_id: PROJECTS_DATABASE_ID,
        filter: baseFilters.length > 1 ? { and: baseFilters } : baseFilters[0],
        page_size: 100,
      });
      const match = (listRes.results as any[]).find((p: any) => {
        const props = p.properties || {};
        const rawSlug =
          props.slug?.rich_text?.[0]?.plain_text ||
          props.Slug?.rich_text?.[0]?.plain_text ||
          '';
        const titleText = props.Title?.title?.[0]?.plain_text || 'Untitled';
        const generated =
          (rawSlug ||
            titleText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
        return generated === slug;
      });
      if (!match) return null;
      page = match;
    }
    const blocks = await notion.blocks.children.list({ block_id: page.id });

    const props = page.properties || {};

    const title = props.Title?.title?.[0]?.plain_text || 'Untitled';
    const subtitle = props.Subtitle?.rich_text?.[0]?.plain_text || '';
    const description = props.Description?.rich_text?.[0]?.plain_text || '';

    let coverImage = '';
    if (page.cover) {
      if (page.cover.type === 'external') {
        coverImage = validateImageUrl(page.cover.external.url);
      } else if (page.cover.type === 'file') {
        coverImage = validateImageUrl(page.cover.file.url);
      }
    }
    if (!coverImage && props.CoverImage?.files?.[0]) {
      const f = props.CoverImage.files[0];
      coverImage = validateImageUrl(f?.file?.url || f?.external?.url || '');
    }
    if (!coverImage) {
      const coverText =
        props.CoverImage?.rich_text?.[0]?.plain_text ||
        props.CoverImageUrl?.url ||
        props.CoverImageUrl?.rich_text?.[0]?.plain_text ||
        props.Coverlmage?.rich_text?.[0]?.plain_text ||
        '';
      if (coverText) {
        if (/^https?:\/\//i.test(coverText)) {
          coverImage = coverText;
        } else {
          coverImage = `/images/covers/${coverText}`;
        }
      }
    }

    const thumbnail =
      props.Thumbnail?.files?.[0]?.file?.url ||
      props.Thumbnail?.files?.[0]?.external?.url ||
      '';

    const technologies = props.Technologies?.multi_select?.map((t: any) => t.name) || [];
    const category = props.Category?.select?.name || undefined;
    const role = props.Role?.select?.name || '';
    const year =
      props.Year?.select?.name ||
      (typeof props.Year?.number === 'number' ? String(props.Year.number) : '') ||
      '';

    const featured = !!props.Featured?.checkbox;
    const projectUrl = props.ProjectUrl?.url || '';
    const githubUrl = props.GitHubUrl?.url || props.GithubUrl?.url || '';

    const rawSlug =
      props.slug?.rich_text?.[0]?.plain_text ||
      props.Slug?.rich_text?.[0]?.plain_text ||
      '';
    const resolvedSlug =
      rawSlug ||
      title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const language = props.Language?.select?.name || undefined;

    const client = props.Client?.rich_text?.[0]?.plain_text || '';
    const responsibilities =
      props.Responsibilities?.rich_text?.[0]?.plain_text?.split('\n') || [];

    return {
      id: page.id,
      title,
      subtitle,
      description,
      coverImage: coverImage || thumbnail || '',
      thumbnail,
      technologies,
      category,
      role,
      year,
      featured,
      projectUrl,
      githubUrl,
      slug: resolvedSlug,
      language,
      client,
      responsibilities,
      content: blocks.results,
    };
  } catch (error) {
    console.error('Error fetching project by slug from Notion:', error);
    return null;
  }
}

/**
 * 获取所有博客文章
 * 优先从 Notion Database 读取；若未配置则回退到父页面子页模式
 * 可选参数：language 用于过滤 'Chinese' | 'English'
 */
export async function getAllBlogPosts(options?: { language?: string; limit?: number }) {
  try {
    // 如果配置了数据库ID，则从数据库读取
    if (BLOG_DATABASE_ID) {
      // 构建过滤器：Status=Published，且（可选）Language=options.language
      // 探测 Language 字段是否存在（仅首轮探测一次）
      if (blogDbHasLanguageProp === null) {
        try {
          const dbMeta: any = await notion.databases.retrieve({ database_id: BLOG_DATABASE_ID });
          blogDbHasLanguageProp = !!dbMeta?.properties?.Language;
        } catch {
          blogDbHasLanguageProp = false;
        }
      }

      const includeLanguageFilter = !!(options?.language && blogDbHasLanguageProp);

      const filters: any[] = [
        { property: 'Status', select: { equals: 'Published' } },
      ];
      if (includeLanguageFilter) {
        filters.push({ property: 'Language', select: { equals: options!.language! } });
      }

      // 简易缓存（按语言维度缓存）
      const cacheKey = `list:${includeLanguageFilter ? options!.language! : 'all'}`;
      const cached = blogListCache.get(cacheKey);
      const now = Date.now();
      if (cached && cached.expiry > now) {
        return cached.data;
      }

      const response = await notion.databases.query({
        database_id: BLOG_DATABASE_ID,
        filter: filters.length > 1 ? { and: filters } : filters[0],
        sorts: [{ property: 'PublishDate', direction: 'descending' }],
        page_size: options?.limit || 100, // 默认最多100条
      });

      const posts = await Promise.all(
        response.results.map(async (page: any) => {
          try {
            const pageAny = page as any;
            const props = pageAny.properties;

            // 标题
            const title =
              props.Title?.title?.[0]?.plain_text ||
              pageAny.child_page?.title ||
              'Untitled';

            // 摘要：优先 Summary/Excerpt 字段，没有则取首段
            let excerpt =
              props.Summary?.rich_text?.[0]?.plain_text ||
              props.Excerpt?.rich_text?.[0]?.plain_text ||
              '';

            if (!excerpt) {
              const headBlocks = await notion.blocks.children.list({
                block_id: page.id,
                page_size: 8,
              });
              const firstPara: any = headBlocks.results.find(
                (b: any) => b.type === 'paragraph'
              );
              excerpt =
                firstPara?.paragraph?.rich_text?.[0]?.plain_text || '';
            }

            // 封面
            let coverImage = '';

            // 1. 首先尝试从 Notion 页面封面获取
            if (pageAny.cover) {
              if (pageAny.cover.type === 'external') {
                coverImage = validateImageUrl(pageAny.cover.external.url);
              } else if (pageAny.cover.type === 'file') {
                coverImage = validateImageUrl(pageAny.cover.file.url);
              }
            }

            // 2. 若数据库有 CoverImage 属性则优先
            if (!coverImage && props.CoverImage?.files?.[0]) {
              const f = props.CoverImage.files[0];
              coverImage = validateImageUrl(f?.file?.url || f?.external?.url || '');
            }

            // 3. 兼容 Text/URL 类型 CoverImage，支持本地文件名映射到 /images/covers/*
            if (!coverImage) {
              const coverText =
                props.CoverImage?.rich_text?.[0]?.plain_text ||
                props.CoverImageUrl?.url ||
                props.CoverImageUrl?.rich_text?.[0]?.plain_text ||
                props.Coverlmage?.rich_text?.[0]?.plain_text ||
                '';
              if (coverText) {
                if (/^https?:\/\//i.test(coverText)) {
                  coverImage = coverText;
                } else {
                  coverImage = `/images/covers/${coverText}`;
                }
              }
            }

            // 4. 如果都没有找到，使用默认占位图
            if (!coverImage) {
              coverImage = '/images/covers/placeholder.svg';
            }

            // 标签
            const tags =
              props.Tags?.multi_select?.map((t: any) => t.name) || [];

            // slug
            const slug =
              props.slug?.rich_text?.[0]?.plain_text ||
              props.Slug?.rich_text?.[0]?.plain_text ||
              title
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');

            // 时间
            const createdTime = new Date(
              props.PublishDate?.date?.start || pageAny.created_time
            );
            const lastEditedTime = new Date(pageAny.last_edited_time);

            // 估算阅读时长（基于摘要）
            const readTime =
              Math.max(3, Math.ceil(excerpt.split(/\s+/).length / 200)) +
              ' min read';

            // 评测字段
            const ratingOverall = Number(props.Rating_Overall?.number ?? 0);
            const ratingEase = Number(props.Rating_EaseOfUse?.number ?? 0);
            const ratingFeatures = Number(props.Rating_Features?.number ?? 0);
            const prosText =
              props.Pros?.rich_text?.map((t: any) => t.plain_text).join('') ||
              '';
            const consText =
              props.Cons?.rich_text?.map((t: any) => t.plain_text).join('') ||
              '';
            const toolWebsite = props.Tool_Website?.url || '';
    const toolPricing =
      props.Tool_Pricing?.rich_text?.[0]?.plain_text || '';

    // Comparison table (optional, JSON strings in Notion)
    let parsedComparisonColumns: any[] | undefined = undefined;
    let parsedComparisonData: any[] | undefined = undefined;
    try {
      const colText =
        (props as any).ComparisonColumns?.rich_text?.map((t: any) => t.plain_text).join('') ||
        (props as any).Comparison_Columns?.rich_text?.map((t: any) => t.plain_text).join('') ||
        (props as any).ComparisonColumns?.url ||
        (props as any).Comparison_Columns?.url ||
        '';
      if (colText) {
        const parsed = JSON.parse(colText);
        if (Array.isArray(parsed)) parsedComparisonColumns = parsed;
      }
    } catch {}
    try {
      const dataText =
        (props as any).ComparisonData?.rich_text?.map((t: any) => t.plain_text).join('') ||
        (props as any).Comparison_Data?.rich_text?.map((t: any) => t.plain_text).join('') ||
        (props as any).ComparisonData?.url ||
        (props as any).Comparison_Data?.url ||
        '';
      if (dataText) {
        const parsed = JSON.parse(dataText);
        if (Array.isArray(parsed)) parsedComparisonData = parsed;
      }
    } catch {}

    return {
              id: page.id,
              title,
              excerpt:
                excerpt.substring(0, 200) +
                (excerpt.length > 200 ? '...' : ''),
              coverImage,
              date: createdTime.toISOString(),
              author:
                props.Author?.people?.[0]?.name ||
                props.AuthorName?.rich_text?.[0]?.plain_text ||
                'MisoTech',
              authorImage:
                props.Author?.people?.[0]?.avatar_url || '',
              readTime,
              tags,
              slug,
              lastEditedTime: lastEditedTime.toISOString(),

              // 评测字段
              ratingOverall,
              ratingEase,
              ratingFeatures,
              pros: prosText,
              cons: consText,
              toolWebsite,
              toolPricing,

              // 语言（用于前端可选过滤）
              language:
                props.Language?.select?.name || undefined,
              status: props.Status?.select?.name || undefined,
            };
          } catch (e) {
            console.error('Error mapping blog page:', e);
            return null;
          }
        })
      );

      const result = posts.filter((p): p is NonNullable<typeof p> => !!p);
      // 写入缓存
      blogListCache.set(cacheKey, { data: result, expiry: Date.now() + BLOG_LIST_CACHE_TTL_MS });
      return result;
    }

    // 未配置数据库ID，回退到父页面模式
    if (!BLOG_PARENT_PAGE_ID) {
      console.error('BLOG_PARENT_PAGE_ID not configured');
      return [];
    }

    const response = await notion.blocks.children.list({
      block_id: BLOG_PARENT_PAGE_ID,
    });

    const pageBlocks = response.results.filter(
      (block: any) => block.type === 'child_page'
    );

    const blogPosts = await Promise.all(
      pageBlocks.map(async (block: any) => {
        try {
          const page = await notion.pages.retrieve({ page_id: block.id });
          const pageAny = page as any;

          const properties = pageAny.properties;

          const blocks = await notion.blocks.children.list({
            block_id: block.id,
            page_size: 5,
          });

          const firstParagraph = blocks.results.find(
            (b: any) => b.type === 'paragraph'
          );
          const firstParagraphAny = firstParagraph as any;
          const excerpt =
            firstParagraphAny?.paragraph?.rich_text?.[0]?.plain_text || '';

          let coverImage = '';
          if (pageAny.cover) {
            if (pageAny.cover.type === 'external') {
              coverImage = pageAny.cover.external.url;
            } else if (pageAny.cover.type === 'file') {
              coverImage = pageAny.cover.file.url;
            }
          }

          const title = block.child_page?.title || 'Untitled';
          const createdTime = new Date(pageAny.created_time);
          const lastEditedTime = new Date(pageAny.last_edited_time);

          return {
            id: page.id,
            title,
            excerpt:
              excerpt.substring(0, 200) +
              (excerpt.length > 200 ? '...' : ''),
            coverImage,
            date: createdTime.toISOString(),
            author: properties.Author?.people?.[0]?.name ||
                    (properties.AuthorText?.rich_text?.[0]?.plain_text?.trim() ||
                     properties.AuthorName?.rich_text?.[0]?.plain_text?.trim()) ||
                    'MisoTech',
            authorImage: properties.Author?.people?.[0]?.avatar_url || '',
            readTime: properties.ReadingTime?.number
              ? `${properties.ReadingTime.number} min read`
              : `${Math.max(3, Math.ceil(excerpt.split(/\s+/).length / 200))} min read`,
            tags:
              properties.Tags?.multi_select?.map((tag: any) => tag.name) ||
              [],
            slug: title
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, ''),
            lastEditedTime: lastEditedTime.toISOString(),
          };
        } catch (error) {
          console.error(`Error fetching blog post ${block.id}:`, error);
          return null;
        }
      })
    );

    return blogPosts
      .filter((post): post is NonNullable<typeof post> => post !== null)
      .sort(
        (a, b) =>
          new Date(b.lastEditedTime).getTime() -
          new Date(a.lastEditedTime).getTime()
      );
  } catch (error) {
    console.error('Error fetching blog posts from Notion:', error);
    return [];
  }
}

/**
 * 获取博客文章详情（完整内容块）
 */
export async function getBlogPostById(id: string) {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    const pageAny = page as any;

    // 内容块（递归获取所有分页）
    const blocks: any[] = [];
    let cursor: string | undefined = undefined;
    do {
      const res = await notion.blocks.children.list({
        block_id: id,
        start_cursor: cursor,
        page_size: 100,
      });
      blocks.push(...res.results);
      cursor = (res as any).next_cursor || undefined;
    } while (cursor);

    // 标题
    const title =
      pageAny.properties?.Title?.title?.[0]?.plain_text ||
      pageAny.properties?.title?.title?.[0]?.plain_text ||
      pageAny.child_page?.title ||
      'Untitled';

    // 封面
    let coverImage = '';
    if (pageAny.cover) {
      if (pageAny.cover.type === 'external') {
        coverImage = validateImageUrl(pageAny.cover.external.url);
      } else if (pageAny.cover.type === 'file') {
        coverImage = validateImageUrl(pageAny.cover.file.url);
      }
    }
    if (!coverImage && pageAny.properties?.CoverImage?.files?.[0]) {
      const f = pageAny.properties.CoverImage.files[0];
      coverImage = validateImageUrl(f?.file?.url || f?.external?.url || '');
    }
    // 兼容 Text/URL 类型 CoverImage（或误写 Coverlmage），支持本地文件名映射到 /images/covers/*
    if (!coverImage) {
      const coverText =
        pageAny.properties?.CoverImage?.rich_text?.[0]?.plain_text ||
        pageAny.properties?.CoverImageUrl?.url ||
        pageAny.properties?.CoverImageUrl?.rich_text?.[0]?.plain_text ||
        pageAny.properties?.Coverlmage?.rich_text?.[0]?.plain_text ||
        '';
      if (coverText) {
        if (/^https?:\/\//i.test(coverText)) {
          coverImage = coverText;
        } else {
          coverImage = `/images/covers/${coverText}`;
        }
      }
    }

    // 元数据
    const props = pageAny.properties || {};
    const createdTime = new Date(
      props.PublishDate?.date?.start || pageAny.created_time
    );
    const lastEditedTime = new Date(pageAny.last_edited_time);

    // 摘要
    let excerpt =
      props.Summary?.rich_text?.[0]?.plain_text ||
      props.Excerpt?.rich_text?.[0]?.plain_text ||
      '';
    if (!excerpt) {
      const firstPara: any = blocks.find((b: any) => b.type === 'paragraph');
      excerpt = firstPara?.paragraph?.rich_text?.[0]?.plain_text || '';
    }

    // 评测扩展
    const ratingOverall = Number(props.Rating_Overall?.number ?? 0);
    const ratingEase = Number(props.Rating_EaseOfUse?.number ?? 0);
    const ratingFeatures = Number(props.Rating_Features?.number ?? 0);
    const prosText =
      props.Pros?.rich_text?.map((t: any) => t.plain_text).join('') || '';
    const consText =
      props.Cons?.rich_text?.map((t: any) => t.plain_text).join('') || '';
    const toolWebsite = props.Tool_Website?.url || '';
    const toolPricing =
      props.Tool_Pricing?.rich_text?.[0]?.plain_text || '';

    // Comparison table (optional, JSON strings in Notion)
    let parsedComparisonColumns: any[] | undefined = undefined;
    let parsedComparisonData: any[] | undefined = undefined;
    try {
      const colText =
        (props as any).ComparisonColumns?.rich_text?.map((t: any) => t.plain_text).join('') ||
        (props as any).Comparison_Columns?.rich_text?.map((t: any) => t.plain_text).join('') ||
        (props as any).ComparisonColumns?.url ||
        (props as any).Comparison_Columns?.url ||
        '';
      if (colText) {
        const parsed = JSON.parse(colText);
        if (Array.isArray(parsed)) parsedComparisonColumns = parsed;
      }
    } catch {}
    try {
      const dataText =
        (props as any).ComparisonData?.rich_text?.map((t: any) => t.plain_text).join('') ||
        (props as any).Comparison_Data?.rich_text?.map((t: any) => t.plain_text).join('') ||
        (props as any).ComparisonData?.url ||
        (props as any).Comparison_Data?.url ||
        '';
      if (dataText) {
        const parsed = JSON.parse(dataText);
        if (Array.isArray(parsed)) parsedComparisonData = parsed;
      }
    } catch {}

    return {
      id: page.id,
      title,
      excerpt: excerpt.substring(0, 200) + (excerpt.length > 200 ? '...' : ''),
      coverImage,
      date: createdTime.toISOString(),
      author:
        props.Author?.people?.[0]?.name ||
        (props.AuthorText?.rich_text?.[0]?.plain_text?.trim() ||
         props.AuthorName?.rich_text?.[0]?.plain_text?.trim()) ||
        'MisoTech',
      authorImage: props.Author?.people?.[0]?.avatar_url || '',
      readTime: props.ReadingTime?.number
        ? `${props.ReadingTime.number} min read`
        : Math.max(3, Math.ceil(excerpt.split(/\s+/).length / 200)) + ' min read',
      tags: props.Tags?.multi_select?.map((tag: any) => tag.name) || [],
      content: blocks,
      createdTime: createdTime.toISOString(),
      lastEditedTime: lastEditedTime.toISOString(),

      // 扩展字段
      ratingOverall,
      ratingEase,
      ratingFeatures,
      pros: prosText,
      cons: consText,
      toolWebsite,
      toolPricing,

      // Comparison table (parsed from Notion JSON text/url)
      comparisonColumns: parsedComparisonColumns,
      comparisonData: parsedComparisonData,

      language: props.Language?.select?.name || undefined,
      status: props.Status?.select?.name || undefined,
      slug:
        props.slug?.rich_text?.[0]?.plain_text ||
        props.Slug?.rich_text?.[0]?.plain_text ||
        title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    };
  } catch (error) {
    console.error('Error fetching blog post from Notion:', error);
    return null;
  }
}

/**
 * 获取关于我页面内容
 */
export async function getAboutPageContent() {
  try {
    const page = await notion.pages.retrieve({ page_id: ABOUT_PAGE_ID });
    const blocks = await notion.blocks.children.list({ block_id: ABOUT_PAGE_ID });
    
    // @ts-ignore - Notion API类型定义不完整
    const { properties } = page as any;
    
    return {
      bio: properties.Bio.rich_text[0]?.plain_text || '',
      profileImage: properties.ProfileImage.files[0]?.file?.url || '',
      skills: properties.Skills.rich_text[0]?.plain_text.split('\n').map((skill: string) => {
        const [name, level] = skill.split(':');
        return { name, level: parseInt(level) };
      }),
      experience: properties.Experience.rich_text[0]?.plain_text.split('\n\n').map((exp: string) => {
        const lines = exp.split('\n');
        return {
          title: lines[0] || '',
          company: lines[1] || '',
          period: lines[2] || '',
          description: lines.slice(3).join('\n') || '',
        };
      }),
      galleryImages: properties.GalleryImages.files.map((file: any) => file.file?.url || ''),
      content: blocks.results,
    };
  } catch (error) {
    console.error('Error fetching about page from Notion:', error);
    return null;
  }
}

/**
 * 将Notion块转换为HTML，增强媒体支持
 */
export function renderNotionBlocks(blocks: any[]) {
  let html = '';
  
  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        html += `<p class="mb-4 text-neutral-dark dark:text-dark-neutral-dark">${renderRichText(block.paragraph.rich_text)}</p>`;
        break;
      case 'heading_1':
        html += `<h1 class="text-3xl font-bold mb-4 text-neutral-darker dark:text-dark-neutral-darker">${renderRichText(block.heading_1.rich_text)}</h1>`;
        break;
      case 'heading_2':
        html += `<h2 class="text-2xl font-semibold mb-3 text-neutral-darker dark:text-dark-neutral-darker">${renderRichText(block.heading_2.rich_text)}</h2>`;
        break;
      case 'heading_3':
        html += `<h3 class="text-xl font-semibold mb-2 text-neutral-darker dark:text-dark-neutral-darker">${renderRichText(block.heading_3.rich_text)}</h3>`;
        break;
      case 'bulleted_list_item':
        html += `<ul class="list-disc list-inside mb-4 ml-4"><li class="mb-2 text-neutral-dark dark:text-dark-neutral-dark">${renderRichText(block.bulleted_list_item.rich_text)}</li></ul>`;
        break;
      case 'numbered_list_item':
        html += `<ol class="list-decimal list-inside mb-4 ml-4"><li class="mb-2 text-neutral-dark dark:text-dark-neutral-dark">${renderRichText(block.numbered_list_item.rich_text)}</li></ol>`;
        break;
      case 'code':
        html += `<div class="mb-4"><pre class="bg-neutral-light dark:bg-dark-neutral-light p-4 rounded-lg overflow-x-auto"><code class="language-${block.code.language} text-sm">${renderRichText(block.code.rich_text)}</code></pre></div>`;
        break;
      case 'quote':
        html += `<blockquote class="border-l-4 border-primary pl-4 mb-4 italic text-neutral-medium dark:text-dark-neutral-medium">${renderRichText(block.quote.rich_text)}</blockquote>`;
        break;
      case 'image':
        const imageUrl = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
        const caption = block.image.caption ? renderRichText(block.image.caption) : '';
        html += `
          <figure class="my-6">
            <div class="relative overflow-hidden rounded-lg">
              <img 
                src="${imageUrl}" 
                alt="${caption}" 
                class="w-full h-auto rounded-lg transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </div>
            ${caption ? `<figcaption class="text-center text-sm text-neutral-medium dark:text-dark-neutral-medium mt-2">${caption}</figcaption>` : ''}
          </figure>
        `;
        break;
      case 'video':
        const videoUrl = block.video.type === 'external' ? block.video.external.url : block.video.file.url;
        const videoCaption = block.video.caption ? renderRichText(block.video.caption) : '';
        
        // 处理YouTube嵌入
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
          const embedUrl = convertToEmbedUrl(videoUrl);
          html += `
            <figure class="my-6">
              <div class="relative overflow-hidden rounded-lg" style="padding-bottom: 56.25%;">
                <iframe 
                  src="${embedUrl}"
                  title="${videoCaption || 'Video'}"
                  class="absolute top-0 left-0 w-full h-full rounded-lg"
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>
              </div>
              ${videoCaption ? `<figcaption class="text-center text-sm text-neutral-medium dark:text-dark-neutral-medium mt-2">${videoCaption}</figcaption>` : ''}
            </figure>
          `;
        } else {
          // 普通视频
          html += `
            <figure class="my-6">
              <div class="relative overflow-hidden rounded-lg" style="padding-bottom: 56.25%;">
                <video 
                  controls 
                  class="absolute top-0 left-0 w-full h-full rounded-lg"
                  src="${videoUrl}"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              ${videoCaption ? `<figcaption class="text-center text-sm text-neutral-medium dark:text-dark-neutral-medium mt-2">${videoCaption}</figcaption>` : ''}
            </figure>
          `;
        }
        break;
      case 'embed':
        const embedUrl = block.embed.url;
        html += `
          <div class="my-6">
            <div class="relative overflow-hidden rounded-lg" style="padding-bottom: 56.25%;">
              <iframe 
                src="${embedUrl}"
                class="absolute top-0 left-0 w-full h-full rounded-lg"
                frameborder="0"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        `;
        break;
      case 'divider':
        html += '<hr class="my-8 border-neutral-light dark:border-dark-neutral-light" />';
        break;
      case 'callout':
        const calloutIcon = block.callout.icon?.emoji || '💡';
        html += `
          <div class="my-6 p-4 bg-primary/10 border-l-4 border-primary rounded-r-lg">
            <div class="flex items-start">
              <span class="text-xl mr-3">${calloutIcon}</span>
              <div class="text-neutral-dark dark:text-dark-neutral-dark">${renderRichText(block.callout.rich_text)}</div>
            </div>
          </div>
        `;
        break;
    }
  }
  
  return html;
}

/**
 * 将YouTube URL转换为嵌入URL
 */
function convertToEmbedUrl(url: string): string {
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(youtubeRegex);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
}

/**
 * 渲染富文本
 */
function renderRichText(richText: any[]) {
  return richText.map((text: any) => {
    let content = text.plain_text;
    
    if (text.annotations.bold) {
      content = `<strong>${content}</strong>`;
    }
    
    if (text.annotations.italic) {
      content = `<em>${content}</em>`;
    }
    
    if (text.annotations.strikethrough) {
      content = `<del>${content}</del>`;
    }
    
    if (text.annotations.underline) {
      content = `<u>${content}</u>`;
    }
    
    if (text.annotations.code) {
      content = `<code>${content}</code>`;
    }
    
    if (text.href) {
      content = `<a href="${text.href}" target="_blank" rel="noopener noreferrer">${content}</a>`;
    }
    
    return content;
  }).join('');
}

/**
 * 根据文章ID获取评论
 * @param postId 文章ID
 * @returns 评论列表
 */
export const getCommentsByPostId = async (postId: string): Promise<CommentType[]> => {
  try {
    // 检查是否配置了Notion API密钥和数据库ID
    if (!process.env.NOTION_API_KEY || !COMMENTS_DATABASE_ID) {
      console.log('Notion API key or database ID not configured, using local storage');
      return getLocalCommentsByPostId(postId);
    }

    const response = await notion.databases.query({
      database_id: COMMENTS_DATABASE_ID,
      filter: {
        property: 'PostId',
        rich_text: {
          equals: postId,
        },
      },
    });

    const comments = response.results.map((page) => {
      // @ts-ignore - Notion API类型定义不完整
      const { properties } = page as any;
      
      return {
        id: page.id,
        postId: properties.PostId.rich_text[0]?.plain_text || '',
        parentId: properties.ParentId.rich_text[0]?.plain_text || null,
        author: {
          name: properties.AuthorName.rich_text[0]?.plain_text || '',
          email: properties.AuthorEmail.email || '',
          avatar: properties.AuthorAvatar?.url || null,
        },
        content: properties.Content.rich_text[0]?.plain_text || '',
        createdAt: new Date(properties.CreatedAt.date?.start || Date.now()).toISOString(),
        replies: [],
      } as CommentType;
    });

    // 构建评论树
    const commentMap = new Map<string, CommentType>();
    const rootComments: CommentType[] = [];

    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach((comment) => {
      if (comment.parentId) {
        const parentComment = commentMap.get(comment.parentId);
        if (parentComment && parentComment.replies) {
          parentComment.replies.push(commentMap.get(comment.id) as CommentType);
        }
      } else {
        rootComments.push(commentMap.get(comment.id) as CommentType);
      }
    });

    return rootComments;
  } catch (error) {
    console.error('Error fetching comments from Notion:', error);
    // 使用本地存储作为备选方案
    return getLocalCommentsByPostId(postId);
  }
};

/**
 * 添加评论
 * @param comment 评论数据
 * @returns 添加的评论
 */
export const addComment = async (comment: Omit<CommentType, 'id' | 'createdAt'>): Promise<CommentType> => {
  try {
    // 检查是否配置了Notion API密钥和数据库ID
    if (!process.env.NOTION_API_KEY || !COMMENTS_DATABASE_ID) {
      console.log('Notion API key or database ID not configured, using local storage');
      return addLocalComment(comment);
    }

    // 准备评论数据
    const properties: any = {
      AuthorEmail: {
        email: comment.author.email,
      },
      Content: {
        rich_text: [
          {
            text: {
              content: comment.content,
            },
          },
        ],
      },
      CreatedAt: {
        date: {
          start: new Date().toISOString(),
        },
      },
      PostId: {
        rich_text: [
          {
            text: {
              content: comment.postId,
            },
          },
        ],
      },
      ParentId: {
        rich_text: comment.parentId
          ? [
              {
                text: {
                  content: comment.parentId,
                },
              },
            ]
          : [],
      },
    };

    // 根据Notion数据库列类型设置作者名称
    properties.AuthorName = {
      rich_text: [
        {
          text: {
            content: comment.author.name || '',
          },
        },
      ],
    };

    // 如果有头像URL，则添加
    if (comment.author.avatar) {
      properties.AuthorAvatar = {
        url: comment.author.avatar,
      };
    } else {
      // 如果没有头像，使用默认头像或null
      properties.AuthorAvatar = {
        url: null,
      };
    }

    const response = await notion.pages.create({
      parent: {
        database_id: COMMENTS_DATABASE_ID,
      },
      properties: properties,
    });

    // 返回添加的评论
    return {
      id: response.id,
      postId: comment.postId,
      parentId: comment.parentId,
      author: comment.author,
      content: comment.content,
      createdAt: new Date().toISOString(),
      replies: [],
    };
  } catch (error) {
    console.error('Error adding comment to Notion:', error);
    // 使用本地存储作为备选方案
    return addLocalComment(comment);
  }
};

/**
 * 从本地存储获取评论
 */
function getLocalCommentsByPostId(postId: string): CommentType[] {
  const allComments = localComments.filter(comment => comment.postId === postId);
  return buildCommentTree(allComments);
}

/**
 * 添加本地评论
 */
function addLocalComment(comment: Omit<CommentType, 'id' | 'createdAt'>): CommentType {
  const newComment: CommentType = {
    id: `comment-${Date.now()}`,
    postId: comment.postId,
    parentId: comment.parentId,
    author: {
      name: comment.author.name,
      email: comment.author.email,
      avatar: comment.author.avatar,
    },
    content: comment.content,
    createdAt: new Date().toISOString(),
    replies: [],
  };

  localComments.push(newComment);
  return newComment;
}

/**
 * 构建评论树
 */
function buildCommentTree(comments: CommentType[]): CommentType[] {
  const commentTree: CommentType[] = [];
  const commentMap = new Map<string, CommentType>();
  
  // 首先将所有评论放入Map中
  comments.forEach(comment => {
    commentMap.set(comment.id, comment);
  });
  
  // 然后构建评论树
  comments.forEach(comment => {
    if (!comment.parentId) {
      // 这是顶级评论
      commentTree.push(comment);
    } else {
      // 这是回复
      const parentComment = commentMap.get(comment.parentId);
      if (parentComment) {
        if (!parentComment.replies) {
          parentComment.replies = [];
        }
        parentComment.replies.push(commentMap.get(comment.id) as CommentType);
      }
    }
  });
  
  return commentTree;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Project Inquiry (services-page lead capture)
// ═══════════════════════════════════════════════════════════════════════════

export interface InquiryPayload {
  name: string;
  email: string;
  company?: string;
  backupContact?: string;
  serviceType: string;    // option code, e.g. 'ai-app'
  budget: string;         // option code, e.g. '1500-7500'
  timeline: string;       // option code, e.g. 'this-month'
  description: string;
  referral?: string;      // option code, e.g. 'x-twitter'
  locale: 'en' | 'zh';
}

// Maps the form's option codes to the Notion DB's Select option labels.
// Keep these in sync with the schema documented in the services plan file.
const INQUIRY_SERVICE_TYPE_LABELS: Record<string, string> = {
  'ai-app': 'AI Application',
  'enterprise': 'Enterprise System',
  'mvp': 'Product MVP',
  'advisory': 'Advisory',
  'other': 'Other',
};

const INQUIRY_BUDGET_LABELS: Record<string, string> = {
  'under-1500': '< $1.5k',
  '1500-7500': '$1.5k – $7.5k',
  '7500-30000': '$7.5k – $30k',
  'over-30000': '$30k+',
  'tbd': 'TBD',
};

const INQUIRY_TIMELINE_LABELS: Record<string, string> = {
  'urgent': 'Urgent',
  'this-month': 'Within 1 month',
  'this-quarter': '1 – 3 months',
  'flexible': 'Flexible',
};

const INQUIRY_REFERRAL_LABELS: Record<string, string> = {
  'referral': 'Referral',
  'x-twitter': 'X/Twitter',
  'jike': 'Jike',
  'search': 'Search',
  'blog': 'Blog',
  'linkedin': 'LinkedIn',
  'other': 'Other',
};

/**
 * Write a project inquiry to the Notion Inquiries database.
 *
 * Graceful fallback: if NOTION_API_KEY or NOTION_INQUIRIES_DATABASE_ID is
 * unset, this resolves to { ok: false, skipped: true } without throwing —
 * callers can still treat the submission as successful (EmailJS is the
 * primary channel; Notion is the pipeline ledger).
 *
 * @returns `{ ok: true, id }` on write, `{ ok: false, ... }` on skip/error.
 */
export const addInquiry = async (
  inquiry: InquiryPayload,
): Promise<{ ok: true; id: string } | { ok: false; skipped?: boolean; error?: string }> => {
  if (!process.env.NOTION_API_KEY || !INQUIRIES_DATABASE_ID) {
    console.warn('[addInquiry] NOTION_API_KEY or NOTION_INQUIRIES_DATABASE_ID not set — skipping Notion write.');
    return { ok: false, skipped: true };
  }

  try {
    const properties: any = {
      Name: {
        title: [{ text: { content: inquiry.name } }],
      },
      Email: {
        email: inquiry.email,
      },
      Company: {
        rich_text: inquiry.company
          ? [{ text: { content: inquiry.company } }]
          : [],
      },
      BackupContact: {
        rich_text: inquiry.backupContact
          ? [{ text: { content: inquiry.backupContact } }]
          : [],
      },
      ServiceType: {
        select: { name: INQUIRY_SERVICE_TYPE_LABELS[inquiry.serviceType] || 'Other' },
      },
      Budget: {
        select: { name: INQUIRY_BUDGET_LABELS[inquiry.budget] || 'TBD' },
      },
      Timeline: {
        select: { name: INQUIRY_TIMELINE_LABELS[inquiry.timeline] || 'Flexible' },
      },
      Description: {
        rich_text: [{ text: { content: inquiry.description } }],
      },
      Locale: {
        select: { name: inquiry.locale },
      },
      Status: {
        select: { name: 'New' },
      },
      CreatedAt: {
        date: { start: new Date().toISOString() },
      },
    };

    if (inquiry.referral) {
      properties.Referral = {
        select: { name: INQUIRY_REFERRAL_LABELS[inquiry.referral] || 'Other' },
      };
    }

    const response = await notion.pages.create({
      parent: { database_id: INQUIRIES_DATABASE_ID },
      properties,
    });

    return { ok: true, id: response.id };
  } catch (error: any) {
    console.error('[addInquiry] Error writing inquiry to Notion:', error?.message || error);
    return { ok: false, error: error?.message || 'Unknown Notion write error' };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  Subscribers (邮件订阅 + Web Push，角度2)
//  字段结构与实际 Notion 库对齐（camelCase）：name(title)/email/status/locale/
//  createdAt(created_time)/token(rich_text)/pushSubscription(rich_text)
//  降级模式同 addInquiry：无 NOTION_API_KEY/订阅库 ID 时返回 { ok:false, skipped:true }
// ═══════════════════════════════════════════════════════════════════════════

export type SubscriberStatus = 'pending' | 'active' | 'unsubscribed';
export type Locale = 'en' | 'zh';

export interface SubscriberType {
  id: string;
  email: string | null;
  locale: Locale | null;
  status: SubscriberStatus;
  token: string;          // 确认 token（HMAC 签名）
  unsubscribeToken: string; // 退订 token（独立）
  pushSubscription: string | null; // JSON 文本
  createdAt: string;
}

type SubscriberOk<T> = { ok: true; data: T };
type SubscriberSkip = { ok: false; skipped: true };
type SubscriberErr = { ok: false; skipped?: false; error: string };
type SubscriberResult<T> = SubscriberOk<T> | SubscriberSkip | SubscriberErr;

// —— token 生成（HMAC-SHA256 签名，见 spec §8）——
// 密钥用 REVALIDATE_SECRET 复用（项目已有），不引入新 env。
const TOKEN_SECRET = process.env.REVALIDATE_SECRET || '';
const TOKEN_TTL_CONFIRM_MS = 7 * 24 * 60 * 60 * 1000;   // 7 天
const TOKEN_TTL_UNSUB_MS = 30 * 24 * 60 * 60 * 1000;   // 30 天

function b64url(input: string | Buffer): string {
  return Buffer.from(input as any).toString('base64url');
}

function signToken(payload: { action: string; email: string; nonce: string; exp: number }): string {
  if (!TOKEN_SECRET) throw new Error('REVALIDATE_SECRET not configured for token signing');
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token: string, action: 'confirm' | 'unsubscribe'): { valid: boolean; email?: string; reason?: string } {
  if (!TOKEN_SECRET) return { valid: false, reason: 'no-secret' };
  try {
    const [body, sig] = token.split('.');
    if (!body || !sig) return { valid: false, reason: 'malformed' };
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
    // 常量时间比较，防时序侧信道
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return { valid: false, reason: 'bad-signature' };
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.action !== action) return { valid: false, reason: 'wrong-action' };
    if (Date.now() > payload.exp) return { valid: false, reason: 'expired' };
    return { valid: true, email: payload.email };
  } catch {
    return { valid: false, reason: 'invalid' };
  }
}

function genTokens(email: string): { confirm: string; unsubscribe: string } {
  const nonce = b64url(crypto.randomBytes(16));
  return {
    confirm: signToken({ action: 'confirm', email, nonce, exp: Date.now() + TOKEN_TTL_CONFIRM_MS }),
    unsubscribe: signToken({ action: 'unsubscribe', email, nonce: b64url(crypto.randomBytes(16)), exp: Date.now() + TOKEN_TTL_UNSUB_MS }),
  };
}

// 从 Notion page 提取 Subscriber
function mapPageToSubscriber(page: any): SubscriberType {
  const p = page.properties || {};
  const tokenField = p.token?.rich_text?.[0]?.plain_text || '';
  // token 字段存 "confirm|unsubscribe" 拼接（见 addSubscriber），读取侧切分
  const [confirm, unsubscribe] = tokenField.split('|');
  return {
    id: page.id,
    email: p.email?.email || null,
    locale: (p.locale?.select?.name as Locale) || null,
    status: (p.status?.status?.name as SubscriberStatus) || 'pending',
    token: confirm || '',
    unsubscribeToken: unsubscribe || '',
    pushSubscription: p.pushSubscription?.rich_text?.[0]?.plain_text || null,
    createdAt: p.createdAt?.created_time || page.created_time,
  };
}

/**
 * 邮件订阅：落库 status=pending，生成双 token。
 * 幂等：同 email 已存在则不重复建，返回既有记录。
 */
export const addSubscriber = async (
  email: string,
  locale: Locale,
): Promise<SubscriberResult<SubscriberType>> => {
  if (!process.env.NOTION_API_KEY || !SUBSCRIBERS_DATABASE_ID) {
    console.warn('[addSubscriber] NOTION_API_KEY or SUBSCRIBERS_DATABASE_ID not set - skipping.');
    return { ok: false, skipped: true };
  }
  try {
    // 幂等：先查是否已存在
    const existing = await notion.databases.query({
      database_id: SUBSCRIBERS_DATABASE_ID,
      filter: { property: 'email', email: { equals: email } },
      page_size: 1,
    });
    if (existing.results.length > 0) {
      const page: any = existing.results[0];
      const currentStatus = page.properties?.status?.status?.name;
      const currentLocale = page.properties?.locale?.select?.name;
      const needReset = currentStatus === 'unsubscribed'; // 退订后重新订阅：重置 pending + 重签 token
      const needLocaleUpdate = currentLocale !== locale;

      if (needReset || needLocaleUpdate) {
        const updates: any = {};
        if (needLocaleUpdate) updates.locale = { select: { name: locale } };
        if (needReset) {
          updates.status = { status: { name: 'pending' } };
          // 重签 token
          const { confirm, unsubscribe } = genTokens(email);
          updates.token = { rich_text: [{ text: { content: `${confirm}|${unsubscribe}` } }] };
        }
        const updated: any = await notion.pages.update({ page_id: page.id, properties: updates });
        return { ok: true, data: mapPageToSubscriber(updated) };
      }
      return { ok: true, data: mapPageToSubscriber(page) };
    }

    const { confirm, unsubscribe } = genTokens(email);
    // token 字段存 "confirm|unsubscribe" 拼接，读取侧按需切分
    const tokenField = `${confirm}|${unsubscribe}`;

    const response = await notion.pages.create({
      parent: { database_id: SUBSCRIBERS_DATABASE_ID },
      properties: {
        name: { title: [{ text: { content: email } }] },
        email: { email },
        status: { status: { name: 'pending' } },
        locale: { select: { name: locale } },
        token: { rich_text: [{ text: { content: tokenField } }] },
        pushSubscription: { rich_text: [] },
      },
    });
    return { ok: true, data: mapPageToSubscriber(response) };
  } catch (error: any) {
    console.error('[addSubscriber] Error:', error?.message || error);
    return { ok: false, error: error?.message || 'Unknown error' };
  }
};

/** 确认订阅：校验 confirm token -> status=active */
export const confirmSubscriber = async (
  token: string,
): Promise<SubscriberResult<{ activated: boolean }>> => {
  if (!process.env.NOTION_API_KEY || !SUBSCRIBERS_DATABASE_ID) {
    return { ok: false, skipped: true };
  }
  const v = verifyToken(token, 'confirm');
  if (!v.valid) return { ok: false, error: `invalid-token: ${v.reason}` };
  try {
    const found = await notion.databases.query({
      database_id: SUBSCRIBERS_DATABASE_ID,
      filter: { property: 'email', email: { equals: v.email! } },
      page_size: 1,
    });
    if (found.results.length === 0) return { ok: false, error: 'not-found' };
    const page: any = found.results[0];
    const currentStatus = page.properties?.status?.status?.name;
    // 不拒绝 unsubscribed：重订阅时 addSubscriber 已重置为 pending + 重签 token；
    // 旧 confirm token 靠 7 天有效期 + 邮箱可达性保证安全。
    const alreadyActive = currentStatus === 'active';
    if (!alreadyActive) {
      await notion.pages.update({
        page_id: page.id,
        properties: { status: { status: { name: 'active' } } },
      });
    }
    return { ok: true, data: { activated: !alreadyActive } };
  } catch (error: any) {
    console.error('[confirmSubscriber] Error:', error?.message || error);
    return { ok: false, error: error?.message || 'Unknown error' };
  }
};

/** 退订：校验 unsubscribe token -> status=unsubscribed */
export const unsubscribe = async (
  token: string,
): Promise<SubscriberResult<{ unsubscribed: boolean }>> => {
  if (!process.env.NOTION_API_KEY || !SUBSCRIBERS_DATABASE_ID) {
    return { ok: false, skipped: true };
  }
  const v = verifyToken(token, 'unsubscribe');
  if (!v.valid) return { ok: false, error: `invalid-token: ${v.reason}` };
  try {
    const found = await notion.databases.query({
      database_id: SUBSCRIBERS_DATABASE_ID,
      filter: { property: 'email', email: { equals: v.email! } },
      page_size: 1,
    });
    if (found.results.length === 0) return { ok: false, error: 'not-found' };
    const page: any = found.results[0];
    await notion.pages.update({
      page_id: page.id,
      properties: { status: { status: { name: 'unsubscribed' } } },
    });
    return { ok: true, data: { unsubscribed: true } };
  } catch (error: any) {
    console.error('[unsubscribe] Error:', error?.message || error);
    return { ok: false, error: error?.message || 'Unknown error' };
  }
};

/**
 * 列出订阅者（分页，每页100）。
 * 无 key/库 -> 返回空数组（notify 静默 no-op）。
 */
export const listSubscribers = async (
  opts?: { status?: SubscriberStatus; locale?: Locale; hasPush?: boolean },
): Promise<SubscriberType[]> => {
  if (!process.env.NOTION_API_KEY || !SUBSCRIBERS_DATABASE_ID) {
    return [];
  }
  try {
    const filters: any[] = [];
    if (opts?.status) filters.push({ property: 'status', status: { equals: opts.status } });
    if (opts?.locale) filters.push({ property: 'locale', select: { equals: opts.locale } });
    if (opts?.hasPush) filters.push({ property: 'pushSubscription', rich_text: { is_not_empty: true } });

    const all: any[] = [];
    let cursor: string | undefined;
    do {
      const res: any = await notion.databases.query({
        database_id: SUBSCRIBERS_DATABASE_ID,
        filter: filters.length > 1 ? { and: filters } : filters.length === 1 ? filters[0] : undefined,
        page_size: 100,
        start_cursor: cursor,
      });
      all.push(...res.results);
      cursor = res.has_more ? res.next_cursor : undefined;
    } while (cursor);

    return all.map(mapPageToSubscriber);
  } catch (error: any) {
    console.error('[listSubscribers] Error:', error?.message || error);
    return [];
  }
};

/**
 * 注册 Web Push 订阅（解耦：不依赖先订阅 email，见 spec §9）。
 * pushSubscription 以 endpoint 为唯一键去重：
 *  - 已有同 endpoint 的行 -> 更新 pushSubscription
 *  - 无 -> 新建一行（仅 push + status=active，无 email）
 */
export const addPushSubscription = async (
  pushSubscription: PushSubscriptionJSON,
  locale?: Locale,
): Promise<SubscriberResult<{ id: string }>> => {
  if (!process.env.NOTION_API_KEY || !SUBSCRIBERS_DATABASE_ID) {
    console.warn('[addPushSubscription] Notion not configured - skipping.');
    return { ok: false, skipped: true };
  }
  const endpoint = pushSubscription.endpoint;
  if (!endpoint) {
    return { ok: false, error: 'missing-endpoint' };
  }
  try {
    const subJson = JSON.stringify(pushSubscription);

    // 查是否已有同 endpoint 的行（pushSubscription 字段含 endpoint 子串）
    const found = await notion.databases.query({
      database_id: SUBSCRIBERS_DATABASE_ID,
      filter: { property: 'pushSubscription', rich_text: { contains: endpoint } },
      page_size: 1,
    });

    if (found.results.length > 0) {
      const page: any = found.results[0];
      await notion.pages.update({
        page_id: page.id,
        properties: { pushSubscription: { rich_text: [{ text: { content: subJson } }] } },
      });
      return { ok: true, data: { id: page.id } };
    }

    const response = await notion.pages.create({
      parent: { database_id: SUBSCRIBERS_DATABASE_ID },
      properties: {
        name: { title: [{ text: { content: `push-${endpoint.slice(-12)}` } }] },
        status: { status: { name: 'active' } },
        locale: { select: { name: locale || 'en' } },
        pushSubscription: { rich_text: [{ text: { content: subJson } }] },
      },
    });
    return { ok: true, data: { id: response.id } };
  } catch (error: any) {
    console.error('[addPushSubscription] Error:', error?.message || error);
    return { ok: false, error: error?.message || 'Unknown error' };
  }
};

/** 清除失效的 push 订阅（web-push 返回 410/404 时调用） */
export const clearPushSubscription = async (
  endpoint: string,
): Promise<SubscriberResult<{ cleared: boolean }>> => {
  if (!process.env.NOTION_API_KEY || !SUBSCRIBERS_DATABASE_ID) {
    return { ok: false, skipped: true };
  }
  try {
    const found = await notion.databases.query({
      database_id: SUBSCRIBERS_DATABASE_ID,
      filter: { property: 'pushSubscription', rich_text: { contains: endpoint } },
      page_size: 1,
    });
    if (found.results.length === 0) return { ok: true, data: { cleared: false } };
    const page: any = found.results[0];
    await notion.pages.update({
      page_id: page.id,
      properties: { pushSubscription: { rich_text: [] } },
    });
    return { ok: true, data: { cleared: true } };
  } catch (error: any) {
    console.error('[clearPushSubscription] Error:', error?.message || error);
    return { ok: false, error: error?.message || 'Unknown error' };
  }
};

/**
 * 硬删除订阅者（archived）。需求#1 点名的 removeSubscriber。
 * @param identifier email 或 token（confirm/unsubscribe 均可）
 */
export const removeSubscriber = async (
  identifier: string,
): Promise<SubscriberResult<{ removed: boolean }>> => {
  if (!process.env.NOTION_API_KEY || !SUBSCRIBERS_DATABASE_ID) {
    return { ok: false, skipped: true };
  }
  try {
    // identifier 可能是 email 或 token。若是 token，先解出 email
    let email = identifier;
    if (identifier.includes('.')) {
      const v1 = verifyToken(identifier, 'confirm');
      const v2 = verifyToken(identifier, 'unsubscribe');
      const emailFromToken = v1.valid ? v1.email : v2.valid ? v2.email : null;
      if (emailFromToken) email = emailFromToken;
    }
    const found = await notion.databases.query({
      database_id: SUBSCRIBERS_DATABASE_ID,
      filter: { property: 'email', email: { equals: email } },
      page_size: 1,
    });
    if (found.results.length === 0) return { ok: true, data: { removed: false } };
    await notion.pages.update({ page_id: found.results[0].id, archived: true });
    return { ok: true, data: { removed: true } };
  } catch (error: any) {
    console.error('[removeSubscriber] Error:', error?.message || error);
    return { ok: false, error: error?.message || 'Unknown error' };
  }
};

/**
 * 按 slug 取博客文章（用于 notify 流，见 spec §10）。
 * 仓库无 getBlogPostBySlug，此为 notify 专用精简版：取 title/excerpt/slug。
 */
export const getBlogPostBySlugForNotify = async (
  slug: string,
): Promise<SubscriberResult<{ slug: string; en?: { title: string; excerpt: string }; zh?: { title: string; excerpt: string } }>> => {
  if (!process.env.NOTION_API_KEY || !BLOG_DATABASE_ID) {
    return { ok: false, skipped: true };
  }
  try {
    // 同时查 English 和 Chinese（一篇文章可能中英各一条记录，slug 相同）
    const [enPosts, zhPosts] = await Promise.all([
      getAllBlogPosts({ language: 'English' }),
      getAllBlogPosts({ language: 'Chinese' }),
    ]);
    const enPost = enPosts.find((p: any) => p.slug === slug);
    const zhPost = zhPosts.find((p: any) => p.slug === slug);
    if (!enPost && !zhPost) return { ok: false, error: 'post-not-found' };
    return {
      ok: true,
      data: {
        slug,
        en: enPost ? { title: enPost.title || 'Untitled', excerpt: enPost.excerpt || '' } : undefined,
        zh: zhPost ? { title: zhPost.title || 'Untitled', excerpt: zhPost.excerpt || '' } : undefined,
      },
    };
  } catch (error: any) {
    console.error('[getBlogPostBySlugForNotify] Error:', error?.message || error);
    return { ok: false, error: error?.message || 'Unknown error' };
  }
};