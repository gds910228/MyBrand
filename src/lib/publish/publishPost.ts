/**
 * 发布编排(feat-publish-pipeline):解析 → 图床上传 → AI 字段 → 块转换 → Notion 幂等 upsert → 站点刷新。
 *
 * 双入口共用:
 * - CLI(scripts/publish-post.ts):本地读 Obsidian 文件,revalidate='http' 调线上 /api/revalidate;
 * - /admin/publish API:网页上传,revalidate='direct' 直接调 revalidateBlogPaths(动态 import,
 *   避免 CLI 进程加载 next/cache)。
 *
 * 幂等语义:按 Slug+Language 查重,已存在则更新属性并整体替换正文块(旧的手工/粘贴内容被
 * 干净 blocks 覆盖——这正是本管线的目的),不存在则创建;重复执行结果一致。
 *
 * Notion 限流 3 rps:逐块归档/分批 append 均带小延迟。
 */
import { Client } from '@notionhq/client';
import { visit } from 'unist-util-visit';
import {
  parseMarkdown,
  normalizeFrontmatter,
  estimateReadingMinutes,
  type NormalizedFrontmatter,
} from './parseMarkdown';
import { markdownToNotionBlocks, chunkBlocks } from './markdownToNotion';
import { uploadImages, verifyImagePublic, resolveImageHostConfig, type ImageHostConfig } from './imageHost';
import { generateAiTrio, type AiTrioResult, type AiBlogFields } from './aiFields';
import { generatePreviewUrl } from '../previewToken';
import { toNotionStatusName } from '../contentStatus';

export type PublishStatus = 'draft' | 'scheduled' | 'published';

export interface PublishOptions {
  status?: PublishStatus;
  /** ISO datetime;status 为 scheduled 时必填 */
  scheduledAt?: string;
  /** 是否调用 AI 生成三件套(默认 true;dry-run 下自动跳过) */
  useAi?: boolean;
  /** 调用方已预生成的 AI 结果(CLI 交互确认后传入),与 useAi 互斥,优先级低于 frontmatter */
  aiPreset?: AiTrioResult | null;
  dryRun?: boolean;
  /** 最终字段覆盖(优先级最高),网页端表单编辑后传入 */
  frontmatterOverrides?: Record<string, unknown>;
  siteUrl?: string;
  revalidate?: 'http' | 'direct' | 'none';
  /** 注入图床配置,测试用 */
  imageHostConfig?: ImageHostConfig;
}

export interface PublishResult {
  slug: string;
  language: 'Chinese' | 'English';
  title: string;
  status: PublishStatus;
  pageId: string | null;
  notionUrl: string | null;
  previewUrl: string | null;
  created: boolean;
  blockCount: number;
  images: { total: number; uploaded: number; skipped: number; missing: string[] };
  ai: AiTrioResult | null;
  warnings: string[];
  revalidated: string[];
  dryRun: boolean;
  coverUrl: string | null;
}

export class PublishError extends Error {}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 图片引用匹配:精确 ref → 相对 ref 归一 → 文件名(含/不含扩展名)。
 * Obsidian 的 wiki 引用常是裸文件名,资源可能在 vault 任意 attachments 目录。
 */
export function matchImageBuffer(ref: string, files: Map<string, Buffer>): Buffer | null {
  if (files.has(ref)) return files.get(ref)!;
  const normalized = ref.replace(/^\.\//, '');
  if (files.has(normalized)) return files.get(normalized)!;
  const base = normalized.split('/').pop() || normalized;
  for (const [key, data] of Array.from(files.entries())) {
    const keyBase = key.split('/').pop() || key;
    if (keyBase === base) return data;
    const stem = base.replace(/\.[^.]+$/, '');
    if (keyBase.replace(/\.[^.]+$/, '') === stem) return data;
  }
  return null;
}

interface RewriteOutcome {
  /** 上传成功并已回写/原生外链的图片 */
  resolved: number;
  /** 外链直接保留数(含防盗链以外的外部图) */
  externalKept: number;
  /** 缺失文件或防盗链被移除的 ref */
  dropped: string[];
}

/**
 * 图片 URL 处理(单个出口,保证行为一致):
 * - 本地 ref 有上传 URL → 回写外链;
 * - http 外链 → 保留(公众号防盗链图源除外,Notion/站点都无法显示,移除并告知);
 * - 本地 ref 无文件 → 移除图片块(宁缺毋滥,避免挂图)。
 */
export function rewriteImageUrls(ast: any, urlByRef: Map<string, string>): RewriteOutcome {
  const outcome: RewriteOutcome = { resolved: 0, externalKept: 0, dropped: [] };
  visit(ast, (node: any) => {
    if (node.type !== 'image' || typeof node.url !== 'string' || !node.url) return;
    const ref = node.url;
    if (/^https?:\/\//i.test(ref)) {
      if (/mmbiz\.(qpic|qlogo)\.cn/i.test(ref)) {
        node.url = '';
        outcome.dropped.push(`${ref}(公众号防盗链图源,Notion/站点均无法显示)`);
      } else {
        outcome.externalKept++;
      }
      return;
    }
    const url = urlByRef.get(ref) || urlByRef.get(safeDecode(ref));
    if (url) {
      node.url = url;
      outcome.resolved++;
    } else {
      node.url = '';
      outcome.dropped.push(`${ref}(未提供文件)`);
    }
  });
  return outcome;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** 属性 payload 组装(纯函数,可单测)。schema 为数据库属性名 → { type }。 */
export function buildPostProperties(input: {
  fm: NormalizedFrontmatter & { scheduledAtRaw?: string };
  ai: AiBlogFields | null;
  coverUrl: string | null;
  readingTime: number;
  schema: Record<string, { type: string }>;
  /** 站长署名,默认 Archer(frontmatter.author > env.AUTHOR_NAME > 默认) */
  authorName?: string;
  /** ButtonAllUpdate 属性填充的 revalidate URL */
  buttonUrl?: string | null;
}): Record<string, any> {
  const { fm, ai, coverUrl, readingTime, schema, authorName, buttonUrl } = input;
  const has = (name: string) => Object.prototype.hasOwnProperty.call(schema, name);
  const rt = (text: string) => [{ type: 'text', text: { content: text } }];
  const props: Record<string, any> = {};

  if (!fm.title) throw new PublishError('缺少标题(frontmatter.title 或 AI 生成)');
  props.Title = { title: rt(fm.title) };

  if (!fm.slug) throw new PublishError('缺少 slug(frontmatter.slug 或 AI 生成)');
  const slugProp = has('Slug') ? 'Slug' : has('slug') ? 'slug' : null;
  if (slugProp) props[slugProp] = { rich_text: rt(fm.slug) };

  if (has('Language')) props.Language = { select: { name: fm.language } };
  if (has('Status')) props.Status = { select: { name: toNotionStatusName(fm.status) } };
  if (has('PublishDate')) props.PublishDate = { date: { start: fm.publishDate } };
  if (has('scheduledAt') && fm.status === 'scheduled' && fm.scheduledAtRaw) {
    props.scheduledAt = { date: { start: fm.scheduledAtRaw } };
  }

  const summary = fm.summary || ai?.Summary || '';
  if (summary) {
    const summaryProp = has('Summary') ? 'Summary' : has('Excerpt') ? 'Excerpt' : null;
    if (summaryProp) props[summaryProp] = { rich_text: rt(summary) };
  }

  const tags = fm.tags.length ? fm.tags : ai?.Tags || [];
  if (tags.length && has('Tags')) props.Tags = { multi_select: tags.map((name) => ({ name })) };

  // 封面:页面 cover 恒为 external URL;数据库属性按其真实类型写入(url → url,rich_text → rich_text)
  if (coverUrl) {
    for (const name of ['CoverImageUrl', 'CoverImage', 'Coverlmage']) {
      if (!has(name)) continue;
      const type = schema[name].type;
      props[name] =
        type === 'url'
          ? { url: coverUrl }
          : type === 'files'
            ? { files: [{ type: 'external', name: 'cover', external: { url: coverUrl } }] }
            : { rich_text: rt(coverUrl) };
      break;
    }
  }

  const rating = (prop: string, v: unknown) => {
    if (v == null) return;
    const n = Number(v);
    // 0 分视为"未评分"(AI 对非评测文常输出 0),不写入,避免站点渲染出 0 分评测卡
    if (Number.isFinite(n) && n > 0 && has(prop)) props[prop] = { number: n };
  };
  rating('Rating_Overall', fm.ratingOverall ?? ai?.Rating_Overall);
  rating('Rating_EaseOfUse', fm.ratingEaseOfUse ?? ai?.Rating_EaseOfUse);
  rating('Rating_Features', fm.ratingFeatures ?? ai?.Rating_Features);

  // Pros/Cons:与库中既有数据风格一致,输出 "1. xxx" 编号行(输入侧已剥编号,此处统一补号)
  const numberedLines = (v?: string[]) =>
    v && v.length
      ? v.map((s, i) => `${i + 1}. ${String(s).replace(/^\s*\d+[.、)]\s*/, '')}`).join('\n')
      : undefined;
  const pros = numberedLines(fm.pros) ?? numberedLines(ai?.Pros);
  const cons = numberedLines(fm.cons) ?? numberedLines(ai?.Cons);
  if (pros && has('Pros')) props.Pros = { rich_text: rt(pros) };
  if (cons && has('Cons')) props.Cons = { rich_text: rt(cons) };

  if (ai?.Tool_Website && has('Tool_Website')) props.Tool_Website = { url: ai.Tool_Website };
  const pricing = fm.toolPricing || ai?.Tool_Pricing;
  if (pricing && has('Tool_Pricing')) props.Tool_Pricing = { rich_text: rt(pricing) };

  // 对比表:JSON 字符串写入 rich_text(读取侧 notion.ts 会 JSON.parse;字段名兼容两种拼写)
  // 来源优先级:frontmatter/表单覆盖 > AI
  const cols = fm.comparisonColumns?.length ? fm.comparisonColumns : ai?.ComparisonColumns;
  const data = fm.comparisonData?.length ? fm.comparisonData : ai?.ComparisonData;
  const colsProp = has('ComparisonColumns') ? 'ComparisonColumns' : has('Comparison_Columns') ? 'Comparison_Columns' : null;
  const dataProp = has('ComparisonData') ? 'ComparisonData' : has('Comparison_Data') ? 'Comparison_Data' : null;
  if (cols?.length && colsProp) {
    props[colsProp] = { rich_text: rt(JSON.stringify(cols)) };
  }
  if (data?.length && dataProp) {
    props[dataProp] = { rich_text: rt(JSON.stringify(data)) };
  }

  if (has('ReadingTime')) props.ReadingTime = { number: readingTime };

  // 站长署名:库里 AuthorText(rich_text) 历史上手工填 Archer,管线补默认,frontmatter author 可覆盖
  if (has('AuthorText')) props.AuthorText = { rich_text: rt(authorName || 'Archer') };
  // ButtonAllUpdate(url):库里存"刷新站点缓存"的 revalidate 链接,发布时统一回填
  if (buttonUrl && has('ButtonAllUpdate')) props.ButtonAllUpdate = { url: buttonUrl };

  return props;
}

export async function publishPost(
  rawMarkdown: string,
  input: { files?: Map<string, Buffer> } = {},
  options: PublishOptions = {},
): Promise<PublishResult> {
  const dryRun = !!options.dryRun;
  const useAi = options.useAi !== false && !dryRun;
  const siteUrl = (options.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  const warnings: string[] = [];

  // 1. 解析 + 字段合并(overrides 最高优先)
  const doc = parseMarkdown(rawMarkdown);
  const fm = normalizeFrontmatter({ ...doc.frontmatter, ...(options.frontmatterOverrides || {}) });
  warnings.push(...doc.warnings);

  // 2. AI 三件套(aiPreset 优先复用;dry-run 不烧钱,提示改用真实发布)
  let ai: AiTrioResult | null = options.aiPreset || null;
  if (!ai && useAi && siteUrl) {
    ai = await generateAiTrio(rawMarkdown, { siteUrl });
  } else if (!ai && useAi && !siteUrl) {
    warnings.push('未配置 NEXT_PUBLIC_SITE_URL,跳过 AI 生成(推文外链需要站点地址)');
  }

  // 3. 字段定稿(frontmatter > AI)
  const title = fm.title || ai?.fields.Title || '';
  const slug = fm.slug || ai?.fields.Slug || '';
  const language = doc.frontmatter.language ? fm.language : ai?.fields.Language || fm.language;
  const finalFm: NormalizedFrontmatter = { ...fm, title, slug, language };

  // 4. 图片上传(cover 引用并入上传清单;dry-run 只做匹配检查)
  const files = input.files || new Map<string, Buffer>();
  let urlByRef = new Map<string, string>();
  let uploaded = 0;
  let skippedUploads = 0;

  const needsUpload = (ref: string) => !!ref && !/^https?:\/\//i.test(ref);
  const uploadTargets: string[] = doc.images.map((img) => img.ref).filter(needsUpload);
  if (doc.coverRef && needsUpload(doc.coverRef) && !uploadTargets.includes(doc.coverRef)) {
    uploadTargets.push(doc.coverRef);
  }
  if (!dryRun && uploadTargets.length > 0) {
    const config = options.imageHostConfig || resolveImageHostConfig();
    const toUpload = new Map<string, Buffer>();
    for (const ref of uploadTargets) {
      const buf = matchImageBuffer(ref, files);
      if (buf) toUpload.set(ref, buf);
      else warnings.push(`图片文件未提供,发布后将省略该图: ${ref}`);
    }
    if (toUpload.size > 0) {
      const batch = await uploadImages(toUpload, slug || 'misc', config);
      urlByRef = batch.urlByRef;
      uploaded = batch.uploaded;
      skippedUploads = batch.skipped;
      // 抽检外链:仓库非 Public 或 jsDelivr 缓存延迟时 Notion/站点都会挂图,提前暴露
      const unreachable = await verifyImagePublic(Array.from(urlByRef.values()));
      if (unreachable.length) {
        warnings.push(
          `图床外链暂时不可访问(检查图床仓库是否为 Public;jsDelivr 新文件缓存有秒级延迟): ${unreachable.join(', ')}`,
        );
      }
    }
  }

  // 5. 封面 URL:上传回写 > http 直链;本地路径且未上传成功则不设封面
  let coverUrl: string | null = null;
  if (doc.coverRef && urlByRef.has(doc.coverRef)) coverUrl = urlByRef.get(doc.coverRef)!;
  else if (fm.cover && /^https?:\/\//i.test(fm.cover)) coverUrl = fm.cover;
  else if (doc.coverRef && /^https?:\/\//i.test(doc.coverRef)) coverUrl = doc.coverRef;

  // 6. URL 回写 + 块转换
  const rewrite = rewriteImageUrls(doc.ast, urlByRef);
  if (rewrite.dropped.length) warnings.push(`以下图片已省略: ${rewrite.dropped.join('; ')}`);
  const { blocks, warnings: convertWarnings } = markdownToNotionBlocks(doc.ast);
  warnings.push(...convertWarnings);
  const readingTime = estimateReadingMinutes(doc.body);

  if (dryRun) {
    return {
      slug: slug || '(待定,将由 AI 生成)',
      language,
      title: title || '(未填写,将由 AI 生成)',
      status: options.status || fm.status,
      pageId: null,
      notionUrl: null,
      previewUrl: null,
      created: false,
      blockCount: blocks.length,
      images: {
        total: doc.images.length,
        uploaded: uploadTargets.filter((ref) => matchImageBuffer(ref, files) !== null).length,
        skipped: 0,
        missing: rewrite.dropped,
      },
      ai: null,
      warnings: Array.from(new Set(warnings)),
      revalidated: [],
      dryRun: true,
      coverUrl,
    };
  }

  // 7. Notion 写入
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_BLOG_DATABASE_ID;
  if (!apiKey) throw new PublishError('缺少 NOTION_API_KEY');
  if (!databaseId) throw new PublishError('缺少 NOTION_BLOG_DATABASE_ID');
  const notion = new Client({ auth: apiKey });

  const database: any = await notion.databases.retrieve({ database_id: databaseId });
  const schema = database.properties as Record<string, { type: string }>;

  // status 选项优先于 frontmatter
  const status = options.status || fm.status;
  const scheduledAt = options.scheduledAt;
  if (status === 'scheduled' && !scheduledAt) {
    throw new PublishError('status=scheduled 需要同时提供 scheduledAt(ISO 时间)');
  }
  const properties = buildPostProperties({
    fm: { ...finalFm, status, scheduledAtRaw: scheduledAt },
    ai: ai?.fields || null,
    coverUrl,
    readingTime,
    schema,
    authorName: finalFm.author || process.env.AUTHOR_NAME || 'Archer',
    buttonUrl:
      process.env.BUTTON_ALL_UPDATE_URL ||
      (siteUrl && process.env.REVALIDATE_SECRET
        ? `${siteUrl}/api/revalidate?secret=${process.env.REVALIDATE_SECRET}`
        : null),
  });
  const cover = coverUrl ? { type: 'external' as const, external: { url: coverUrl } } : undefined;

  // 幂等查重:Slug + Language
  const slugPropName = properties.Slug ? 'Slug' : properties.slug ? 'slug' : null;
  let existingId: string | null = null;
  if (slugPropName) {
    const query = await notion.databases.query({
      database_id: databaseId,
      filter: { property: slugPropName, rich_text: { equals: slug } },
      page_size: 10,
    });
    const match = query.results.find((page: any) => {
      const lang = page.properties?.Language?.select?.name;
      return !lang || lang.toLowerCase() === language.toLowerCase();
    });
    existingId = match ? (match as any).id : null;
  }

  const chunks = chunkBlocks(blocks);
  const tailChunks = chunks.slice(1);
  let pageId: string;
  let created: boolean;
  let notionUrl: string | null = null;

  if (existingId) {
    created = false;
    pageId = existingId;
    await notion.pages.update({ page_id: pageId, properties, ...(cover ? { cover } : {}) } as any);
    // 整体替换正文:归档旧顶层块 → 分批 append 新块
    const old: any[] = [];
    let cursor: string | undefined = undefined;
    do {
      const res = await notion.blocks.children.list({ block_id: pageId, start_cursor: cursor, page_size: 100 });
      old.push(...res.results);
      cursor = (res as any).next_cursor || undefined;
    } while (cursor);
    for (const block of old) {
      await notion.blocks.delete({ block_id: block.id });
      await sleep(150);
    }
    for (let i = 0; i < tailChunks.length; i++) {
      await notion.blocks.children.append({ block_id: pageId, children: tailChunks[i] as any });
      if (i < tailChunks.length - 1) await sleep(350);
    }
    const page = await notion.pages.retrieve({ page_id: pageId });
    notionUrl = (page as any).url || null;
  } else {
    created = true;
    const page: any = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
      ...(cover ? { cover } : {}),
      children: chunks[0] as any,
    } as any);
    pageId = page.id;
    notionUrl = page.url || null;
    for (let i = 0; i < tailChunks.length; i++) {
      await notion.blocks.children.append({ block_id: pageId, children: tailChunks[i] as any });
      if (i < tailChunks.length - 1) await sleep(350);
    }
  }

  // 8. 站点刷新
  const revalidateMode = options.revalidate || 'none';
  const revalidated: string[] = [];
  if (revalidateMode === 'direct') {
    const { revalidateBlogPaths } = await import('../../services/revalidate');
    const result = revalidateBlogPaths([slug]);
    revalidated.push(...result.revalidated);
  } else if (revalidateMode === 'http' && siteUrl) {
    const secret = process.env.REVALIDATE_SECRET;
    if (secret) {
      try {
        const res = await fetch(
          `${siteUrl}/api/revalidate?slug=${encodeURIComponent(slug)}&secret=${encodeURIComponent(secret)}`,
        );
        if (res.ok) revalidated.push(`HTTP revalidate(${slug})`);
        else warnings.push(`revalidate 调用失败: HTTP ${res.status}`);
      } catch (err: any) {
        warnings.push(`revalidate 调用失败: ${err?.message || err}`);
      }
    } else {
      warnings.push('未配置 REVALIDATE_SECRET,跳过站点刷新');
    }
  }

  const previewUrl = status === 'draft' && siteUrl ? generatePreviewUrl(pageId, siteUrl) : null;

  return {
    slug,
    language,
    title,
    status,
    pageId,
    notionUrl,
    previewUrl,
    created,
    blockCount: blocks.length,
    images: {
      total: doc.images.length,
      uploaded,
      skipped: skippedUploads,
      missing: rewrite.dropped,
    },
    ai,
    warnings: Array.from(new Set(warnings)),
    revalidated,
    dryRun: false,
    coverUrl,
  };
}
