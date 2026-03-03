import { Client } from '@notionhq/client';

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
                if (coverImage) {
                  console.log(`[Notion] 从页面封面获取图片: ${coverImage}`);
                }
              } else if (pageAny.cover.type === 'file') {
                coverImage = validateImageUrl(pageAny.cover.file.url);
                if (coverImage) {
                  console.log(`[Notion] 从页面文件获取图片: ${coverImage}`);
                }
              }
            }

            // 2. 若数据库有 CoverImage 属性则优先
            if (!coverImage && props.CoverImage?.files?.[0]) {
              const f = props.CoverImage.files[0];
              coverImage = validateImageUrl(f?.file?.url || f?.external?.url || '');
              if (coverImage) {
                console.log(`[Notion] 从数据库CoverImage获取图片: ${coverImage}`);
              }
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
                  console.log(`[Notion] 从文本URL获取图片: ${coverImage}`);
                } else {
                  coverImage = `/images/covers/${coverText}`;
                  console.log(`[Notion] 映射本地图片: ${coverImage}`);
                }
              }
            }

            // 4. 如果都没有找到，使用默认占位图
            if (!coverImage) {
              coverImage = '/images/covers/placeholder.svg';
              console.log(`[Notion] 使用默认占位图: ${coverImage}`);
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