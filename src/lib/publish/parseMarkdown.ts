/**
 * Markdown 解析(feat-publish-pipeline)。
 *
 * 职责:frontmatter 解析 + mdast 生成 + 图片引用提取 + 不可完美转换语法的警告收集。
 * 发布管线的第一步,输出供 imageHost(图片解析上传)与 markdownToNotion(块转换)消费。
 *
 * 纯函数、不依赖 Node fs,可被 vitest 直接单测。
 * Obsidian 方言在进入 remark 前预处理为标准 Markdown:
 * - `![[图片.png]]` / `![[图片.png|说明]]` → `![](图片.png)`(wiki 嵌入 → 标准图片)
 * - `> [!note] 标题` callout 语法保持原样,由 markdownToNotion 在 blockquote 节点上识别。
 */
import matter from 'gray-matter';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

export interface ParsedImage {
  /** md 里的原始引用:相对路径 / 裸文件名(Obsidian wiki)/ 外部 URL */
  ref: string;
  alt: string;
  /** http(s) 外链,无需上传 */
  external: boolean;
  /** 公众号防盗链图源,Notion/站点都无法显示,发布时给出警告 */
  hotlinkProtected: boolean;
}

export interface ParsedDocument {
  /** gray-matter 解析出的 frontmatter(原始值,规范化在 publishPost 做) */
  frontmatter: Record<string, unknown>;
  /** 去 frontmatter 后的 markdown 正文 */
  body: string;
  ast: Root;
  /** 正文按出现顺序的图片引用(已去重) */
  images: ParsedImage[];
  /** frontmatter cover 字段的图片引用(若有) */
  coverRef: string | null;
  /** 无法转换为 Notion 块/需要人工留意的语法警告 */
  warnings: string[];
}

const HOTLINK_HOSTS = ['mmbiz.qpic.cn', 'mmbiz.qlogo.cn'];

function toParsedImage(ref: string, alt: string): ParsedImage {
  const trimmed = ref.trim();
  const external = /^https?:\/\//i.test(trimmed);
  return {
    ref: trimmed,
    alt: alt.trim(),
    external,
    hotlinkProtected: external && HOTLINK_HOSTS.some((h) => trimmed.toLowerCase().includes(h)),
  };
}

/** 预处理 Obsidian wiki 图片嵌入 → 标准图片语法。`![[a.png|alt]]` → `![](a.png)`。
 * 引用含空格时编码为 %20(CommonMark 裸目的地不允许空格),收集阶段再解码还原。 */
export function normalizeWikiEmbeds(markdown: string): string {
  return markdown.replace(/!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g, (_m, name: string, alt?: string) => {
    const clean = String(name).trim().replace(/ /g, '%20');
    // URL 形式的 wiki 嵌入同样转为标准图片
    return `![${(alt || '').trim()}](${clean})`;
  });
}

const processor = unified().use(remarkParse).use(remarkGfm);

export function parseMarkdown(raw: string): ParsedDocument {
  const warnings: string[] = [];
  const normalized = normalizeWikiEmbeds(raw);
  const parsed = matter(normalized);
  const ast = processor.parse(parsed.content) as Root;

  const images: ParsedImage[] = [];
  const seen = new Set<string>();
  visit(ast, (node: any) => {
    switch (node.type) {
      case 'image': {
        let ref = node.url;
        // wiki 嵌入转换时对空格做了 %20 编码,这里解码还原原始引用
        try {
          ref = decodeURIComponent(ref);
        } catch {
          // 已是合法字面量
        }
        if (ref && !seen.has(ref)) {
          seen.add(ref);
          images.push(toParsedImage(ref, node.alt || ''));
        }
        break;
      }
      case 'html':
        warnings.push(
          `原始 HTML 片段将被忽略(Notion 是块结构,不支持内嵌 HTML): ${String(node.value).slice(0, 60)}`,
        );
        break;
      case 'footnoteDefinition':
        warnings.push(`脚注 [${node.identifier}] 不被支持,已忽略`);
        break;
      case 'math':
      case 'inlineMath':
        warnings.push('LaTeX 数学公式不被支持,请改为代码块或文字描述');
        break;
      case 'yaml':
        // remark 不该在 body 里见到 yaml(gray-matter 已剥离),防御性警告
        warnings.push('正文中存在嵌套 YAML 块,已忽略');
        break;
    }
  });

  const coverRaw = parsed.data.cover;
  const coverRef =
    typeof coverRaw === 'string' && coverRaw.trim() ? coverRaw.trim() : null;

  return {
    frontmatter: parsed.data,
    body: parsed.content,
    ast,
    images,
    coverRef,
    warnings,
  };
}

/**
 * frontmatter 规范化:补默认值、归一化类型。
 * 优先级约定:同一字段 frontmatter > AI 生成 > 默认值(合并逻辑在 publishPost)。
 */
export interface NormalizedFrontmatter {
  title: string;
  slug: string;
  language: 'Chinese' | 'English';
  status: 'draft' | 'scheduled' | 'published';
  publishDate: string; // YYYY-MM-DD
  tags: string[];
  summary?: string;
  cover?: string; // 已上传后的 URL,由 publishPost 回填
  // 评测扩展字段(工具评测帖)
  ratingOverall?: number;
  ratingEaseOfUse?: number;
  ratingFeatures?: number;
  pros?: string[];
  cons?: string[];
  toolWebsite?: string;
  toolPricing?: string;
  comparisonColumns?: unknown[];
  comparisonData?: unknown[];
}

function normalizeLanguage(raw: unknown): 'Chinese' | 'English' {
  const v = String(raw ?? '').trim().toLowerCase();
  if (['en', 'english', '英文'].includes(v)) return 'English';
  return 'Chinese'; // 默认中文,含 zh/chinese/中文/空值
}

function normalizeSlug(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, ''); // slug 仅保留字母数字连字符,与站点读取约定一致
}

function toStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean);
  if (typeof raw === 'string') {
    // 兼容 "a, b" / "a、b" 两种分隔
    return raw.split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/** Pros/Cons 兼容数组或换行/序号分隔的字符串。 */
function toLineArray(raw: unknown): string[] | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean);
  if (typeof raw === 'string') {
    return raw
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*\d+[.、)]\s*/, '').trim())
      .filter(Boolean);
  }
  return undefined;
}

export function normalizeFrontmatter(fm: Record<string, unknown>): NormalizedFrontmatter {
  const today = new Date().toISOString().slice(0, 10);
  const rawStatus = String(fm.status ?? '').trim().toLowerCase();
  const status = (['draft', 'scheduled', 'published'].includes(rawStatus)
    ? rawStatus
    : 'draft') as NormalizedFrontmatter['status'];

  const publishDateRaw = String(fm.publishDate ?? fm.date ?? '').trim();
  const publishDate =
    publishDateRaw && !Number.isNaN(Date.parse(publishDateRaw))
      ? new Date(publishDateRaw).toISOString().slice(0, 10)
      : today;

  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    title: String(fm.title ?? '').trim(),
    slug: normalizeSlug(fm.slug),
    language: normalizeLanguage(fm.language),
    status,
    publishDate,
    tags: toStringArray(fm.tags),
    summary: typeof fm.summary === 'string' && fm.summary.trim() ? fm.summary.trim() : undefined,
    cover: typeof fm.cover === 'string' && fm.cover.trim() ? fm.cover.trim() : undefined,
    ratingOverall: num(fm.ratingOverall ?? fm.rating_overall),
    ratingEaseOfUse: num(fm.ratingEaseOfUse ?? fm.rating_easeOfUse ?? fm.rating_easeofuse),
    ratingFeatures: num(fm.ratingFeatures ?? fm.rating_features),
    pros: toLineArray(fm.pros),
    cons: toLineArray(fm.cons),
    toolWebsite: typeof fm.toolWebsite === 'string' ? fm.toolWebsite.trim() : undefined,
    toolPricing: typeof fm.toolPricing === 'string' ? fm.toolPricing.trim() : undefined,
    comparisonColumns: Array.isArray(fm.comparisonColumns) ? fm.comparisonColumns : undefined,
    comparisonData: Array.isArray(fm.comparisonData) ? fm.comparisonData : undefined,
  };
}

/** 字数统计(中文按字、英文按词),用于 ReadingTime 估算。 */
export function estimateReadingMinutes(body: string): number {
  const cjk = (body.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinWords = (body.replace(/[\u4e00-\u9fff]/g, ' ').match(/[a-zA-Z]+/g) || []).length;
  return Math.max(1, Math.round(cjk / 350 + latinWords / 200));
}
