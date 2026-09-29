/**
 * 本地种子 → Notion 服务形状的适配层（feat-search-discovery-20260928，T09）。
 *
 * 定位：`src/data/` 是本项目约定的「Notion 不可用时的本地兜底层」
 * （见 `src/data/comments.ts` 已确立的架构）。本文件把 `src/data/blog.ts`
 * 与 `src/data/projects.ts` 的 `{ en, zh }` 双语种子，展平成 `src/services/notion.ts`
 * 四个读取函数**原本返回的形状**，使空 Notion Key / Notion 调用失败时
 * 站点（列表页、详情页、搜索索引）仍可完整工作。
 *
 * 关键约束（评审 spec_review_v1 D-2）：**必须逐字段展平为标量**。
 * 既有消费方直接使用这些字段（如 `src/app/projects/page.tsx` 把 `project.role`
 * 透传给 `ProjectCard`），若把 `{ en, zh }` 对象直接透传会渲染成 `[object Object]`。
 *
 * 纯数据模块：不做 I/O、不依赖 Next.js，便于单测。
 */
import { blogPosts, type BlogPostType } from '@/data/blog';
import { projects, type ProjectType } from '@/data/projects';

export type SeedLanguage = 'English' | 'Chinese';

/** 把 `{ en, zh }` 展平为请求语言下的字符串；缺失时回落英文，再回落空串。 */
function pick(value: { en: string; zh: string } | undefined, language: SeedLanguage): string {
  if (!value) return '';
  return (language === 'Chinese' ? value.zh : value.en) || value.en || value.zh || '';
}

/** 归一化语言入参：非 'Chinese' 一律按英文处理（与 notion.ts 既有口径一致）。 */
export function normalizeLanguage(language?: string): SeedLanguage {
  return language === 'Chinese' ? 'Chinese' : 'English';
}

// ---------------------------------------------------------------------------
// HTML → Notion 形状 block
// ---------------------------------------------------------------------------

/** 构造一个 Notion 形状的 rich_text 项。 */
function richText(content: string, href: string | null = null) {
  return [
    {
      type: 'text',
      text: { content, link: href ? { url: href } : null },
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default',
      },
      plain_text: content,
      href,
    },
  ];
}

/** 去掉残留的内联 HTML 标签（本地种子正文只用到极少标签）。 */
function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * 把本地种子的 HTML 正文转成 Notion 形状的 block 数组。
 *
 * 只支持种子实际使用的标签子集：`h2` / `h3` / `p` / `ul>li` / `blockquote` / `figure>img`。
 * `NotionRenderer`（博客详情）与 `renderNotionBlocks`（项目详情）都消费这一形状，
 * 因此两者共用本函数即可。
 *
 * 未匹配到任何块时返回空数组——调用方应据此渲染空正文，而不是抛错。
 */
export function htmlToNotionBlocks(html: string | undefined, blockIdPrefix = 'local'): any[] {
  if (!html || typeof html !== 'string') return [];

  const blocks: any[] = [];
  let counter = 0;
  const nextId = () => `${blockIdPrefix}-block-${counter++}`;

  // 按块级标签切分；保留标签本身以便判定类型。
  const tokenRe = /<(h2|h3|p|blockquote|ul|figure)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const inner = match[2];

    if (tag === 'h2' || tag === 'h3') {
      const type = tag === 'h2' ? 'heading_2' : 'heading_3';
      const text = stripTags(inner);
      if (!text) continue;
      blocks.push({ id: nextId(), type, [type]: { rich_text: richText(text) } });
      continue;
    }

    if (tag === 'p') {
      const text = stripTags(inner);
      if (!text) continue;
      blocks.push({ id: nextId(), type: 'paragraph', paragraph: { rich_text: richText(text) } });
      continue;
    }

    if (tag === 'blockquote') {
      const text = stripTags(inner);
      if (!text) continue;
      blocks.push({ id: nextId(), type: 'quote', quote: { rich_text: richText(text) } });
      continue;
    }

    if (tag === 'ul') {
      const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
      let li: RegExpExecArray | null;
      while ((li = liRe.exec(inner)) !== null) {
        const text = stripTags(li[1]);
        if (!text) continue;
        blocks.push({
          id: nextId(),
          type: 'bulleted_list_item',
          bulleted_list_item: { rich_text: richText(text) },
        });
      }
      continue;
    }

    if (tag === 'figure') {
      const imgMatch = /<img\b[^>]*src="([^"]+)"[^>]*>/i.exec(inner);
      if (!imgMatch) continue;
      const url = imgMatch[1];
      const captionMatch = /<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i.exec(inner);
      blocks.push({
        id: nextId(),
        type: 'image',
        image: {
          type: 'external',
          external: { url },
          caption: richText(captionMatch ? stripTags(captionMatch[1]) : ''),
        },
      });
    }
  }

  return blocks;
}

/**
 * 阅读时长：优先用种子显式标注的 `readTime`；否则按正文词数估算。
 * 估算口径与 `notion.ts` 的回落分支保持一致（`max(3, ceil(words/200))`）。
 */
function resolveReadTime(post: BlogPostType, language: SeedLanguage): string {
  if (post.readTime) {
    const explicit = pick(post.readTime, language);
    if (explicit) return explicit;
  }
  const body = pick(post.content, language) || pick(post.excerpt, language);
  const words = stripTags(body).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(3, Math.ceil(words / 200));
  return language === 'Chinese' ? `${minutes} 分钟阅读` : `${minutes} min read`;
}

/** 标签：显式 `tags` 优先，否则回落到 `categories`（既有 10 篇种子未标注 tags）。 */
function resolveTags(post: BlogPostType): string[] {
  if (Array.isArray(post.tags) && post.tags.length > 0) return post.tags.filter(Boolean);
  return Array.isArray(post.categories) ? post.categories.filter(Boolean) : [];
}

// ---------------------------------------------------------------------------
// 博客
// ---------------------------------------------------------------------------

/** 博客列表项：形状对齐 `notion.ts` 的 `getAllBlogPosts` 返回项。 */
export interface LocalBlogListItem {
  id: string;
  title: string;
  excerpt: string;
  coverImage: string;
  date: string;
  author: string;
  authorImage: string;
  readTime: string;
  tags: string[];
  slug: string;
  lastEditedTime: string;
  ratingOverall?: number;
  ratingEase?: number;
  ratingFeatures?: number;
  pros?: string;
  cons?: string;
  toolWebsite?: string;
  toolPricing?: string;
  language: SeedLanguage;
  /** 本地种子一律视为已发布（否则会被 isPubliclyVisible 过滤掉）。 */
  status: string;
  scheduledAt: null;
}

/** 取本地博客种子的列表项（按语言展平）。 */
export function getLocalBlogPosts(language?: string, limit?: number): LocalBlogListItem[] {
  const lang = normalizeLanguage(language);

  const items: LocalBlogListItem[] = blogPosts.map((post) => {
    const updated = post.updatedAt || post.publishedAt;
    return {
      id: post.id,
      title: pick(post.title, lang),
      excerpt: pick(post.excerpt, lang),
      coverImage: post.coverImage,
      // 与 notion.ts 一致：列表项的 date 取创建时间。
      date: new Date(post.publishedAt).toISOString(),
      author: 'MisoTech',
      authorImage: '',
      readTime: resolveReadTime(post, lang),
      tags: resolveTags(post),
      slug: post.slug,
      lastEditedTime: new Date(updated).toISOString(),
      language: lang,
      status: 'published',
      scheduledAt: null,
    };
  });

  // 与 Notion 路径一致：按日期倒序。
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return typeof limit === 'number' && limit > 0 ? items.slice(0, limit) : items;
}

/** 博客详情：形状对齐 `notion.ts` 的 `getBlogPostById`。 */
export function getLocalBlogPostById(id: string, language?: string) {
  const lang = normalizeLanguage(language);
  const post = blogPosts.find((p) => p.id === id);
  if (!post) return null;

  const listItem = getLocalBlogPosts(lang).find((p) => p.id === id);
  const html = pick(post.content, lang);
  const blocks = htmlToNotionBlocks(html, `local-${post.id}`);

  // 种子无正文时用摘要合成一段正文，避免详情页正文区完全空白。
  if (blocks.length === 0) {
    const excerpt = pick(post.excerpt, lang);
    if (excerpt) {
      blocks.push({
        id: `local-${post.id}-block-0`,
        type: 'paragraph',
        paragraph: { rich_text: richText(excerpt) },
      });
    }
  }

  return {
    id: post.id,
    title: pick(post.title, lang),
    excerpt: pick(post.excerpt, lang),
    coverImage: post.coverImage,
    date: new Date(post.publishedAt).toISOString(),
    author: 'MisoTech',
    authorImage: '',
    readTime: resolveReadTime(post, lang),
    tags: resolveTags(post),
    content: blocks,
    createdTime: new Date(post.publishedAt).toISOString(),
    lastEditedTime: new Date(post.updatedAt || post.publishedAt).toISOString(),
    language: lang,
    status: 'published',
    scheduledAt: null,
    slug: post.slug,
    ...(listItem
      ? {
          ratingOverall: listItem.ratingOverall,
          ratingEase: listItem.ratingEase,
          ratingFeatures: listItem.ratingFeatures,
          pros: listItem.pros,
          cons: listItem.cons,
          toolWebsite: listItem.toolWebsite,
          toolPricing: listItem.toolPricing,
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// 项目
// ---------------------------------------------------------------------------

/** 项目列表项：形状对齐 `notion.ts` 的 `getAllProjects` 返回项（含 D-2 要求的 date）。 */
export interface LocalProjectListItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  thumbnail: string;
  technologies: string[];
  category: string | undefined;
  role: string;
  year: string;
  featured: boolean;
  projectUrl: string;
  githubUrl: string;
  slug: string;
  language: SeedLanguage;
  client: string;
  /** 新增：既有消费方与 searchData 读取 `project.date`（D-2）。 */
  date: string;
  /** 新增：兼容 `project.createdTime` 读取路径。 */
  createdTime: string;
}

function toProjectListItem(project: ProjectType, lang: SeedLanguage): LocalProjectListItem {
  const iso = new Date(project.publishedAt).toISOString();
  return {
    id: project.id,
    title: pick(project.title, lang),
    subtitle: pick(project.subtitle, lang),
    description: pick(project.description, lang),
    coverImage: project.coverImage,
    thumbnail: '',
    technologies: Array.isArray(project.technologies) ? project.technologies.filter(Boolean) : [],
    category: project.category || undefined,
    role: pick(project.role, lang),
    year: project.year,
    featured: !!project.featured,
    projectUrl: project.projectUrl || '',
    githubUrl: project.githubUrl || '',
    slug: project.slug,
    language: lang,
    client: project.client,
    date: iso,
    createdTime: iso,
  };
}

/** 取本地项目种子的列表项（按语言展平）。 */
export function getLocalProjects(language?: string, limit?: number): LocalProjectListItem[] {
  const lang = normalizeLanguage(language);

  const items = projects.map((p) => toProjectListItem(p, lang));
  // 与 Notion 路径一致：按日期倒序。
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return typeof limit === 'number' && limit > 0 ? items.slice(0, limit) : items;
}

/** 按 slug 取本地项目（支持语言）。 */
export function getLocalProjectBySlug(slug: string, language?: string): LocalProjectListItem | null {
  const lang = normalizeLanguage(language);
  const project = projects.find((p) => p.slug === slug);
  return project ? toProjectListItem(project, lang) : null;
}

/** 项目详情：形状对齐 `notion.ts` 的 `getProjectById`（含 responsibilities 与 content）。 */
export function getLocalProjectById(id: string, language?: string) {
  const lang = normalizeLanguage(language);
  const project = projects.find((p) => p.id === id);
  if (!project) return null;

  const base = toProjectListItem(project, lang);
  const blocks = htmlToNotionBlocks(pick(project.content, lang), `local-${project.id}`);

  return {
    ...base,
    responsibilities: [] as string[],
    content: blocks,
  };
}
