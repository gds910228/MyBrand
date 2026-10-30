/**
 * Markdown AST → Notion blocks(feat-publish-pipeline)。
 *
 * 块型契约严格对齐站点渲染器 src/components/NotionRenderer.tsx 的 switch 分支,
 * 只生成渲染器真正支持(或本次为其新增 table 支持)的类型:
 * paragraph / heading_1-3 / bulleted_list_item / numbered_list_item / code / quote /
 * callout / image / video / divider / table(新增,含 table_row 子块)。
 * 其余语法(html/脚注/公式等)不猜测,降级并收集 warnings 让发布者知情。
 *
 * 关键降级策略:
 * - 标题 depth>=4 → 降为 heading_3 + 警告
 * - 嵌套列表 → 拍平为同级 list_item(渲染器不递归渲染子块)
 * - 行内图片 → 从段落中拆出为独立 image 块,保持文档顺序
 * - Obsidian callout(`> [!note] 标题`)→ Notion callout + emoji icon
 * - 独立成段的 YouTube/视频直链 → video 块(渲染器会转 iframe)
 *
 * 纯函数,可被 vitest 直接单测。
 */
import type { PhrasingContent, Root, RootContent } from 'mdast';

export interface NotionRichText {
  type: 'text';
  text: { content: string; link?: { url: string } | null };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
  };
}

export interface NotionBlock {
  object: 'block';
  type: string;
  [key: string]: any;
}

export interface ConvertResult {
  blocks: NotionBlock[];
  warnings: string[];
}

interface AnnotationCtx {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
}

const NO_ANNOTATION: AnnotationCtx = {
  bold: false,
  italic: false,
  strikethrough: false,
  underline: false,
  code: false,
};

function richText(content: string, ctx: AnnotationCtx = NO_ANNOTATION, href?: string): NotionRichText[] {
  // Notion rich_text 单条 content 上限 2000 字符,超长拆分为多条同格式片段
  if (content.length <= 1900) {
    return [singleRichText(content, ctx, href)];
  }
  const out: NotionRichText[] = [];
  for (let i = 0; i < content.length; i += 1900) {
    out.push(singleRichText(content.slice(i, i + 1900), ctx, href));
  }
  return out;
}

function singleRichText(content: string, ctx: AnnotationCtx, href?: string): NotionRichText {
  return {
    type: 'text',
    text: { content, link: href ? { url: href } : null },
    annotations: { ...ctx },
  };
}

/** 行内节点 → rich_text。行内图片/HTML 由上层在块级处理,这里仅兜底降级为文本。 */
export function toRichText(
  nodes: PhrasingContent[] | undefined,
  ctx: AnnotationCtx = NO_ANNOTATION,
  href?: string,
  warnings?: string[],
): NotionRichText[] {
  const out: NotionRichText[] = [];
  for (const node of nodes || []) {
    switch (node.type) {
      case 'text': {
        const value = node.value;
        if (value) out.push(...richText(value, ctx, href));
        break;
      }
      case 'break':
        out.push(...richText('\n', ctx, href));
        break;
      case 'strong':
        out.push(...toRichText(node.children, { ...ctx, bold: true }, href, warnings));
        break;
      case 'emphasis':
        out.push(...toRichText(node.children, { ...ctx, italic: true }, href, warnings));
        break;
      case 'delete':
        out.push(...toRichText(node.children, { ...ctx, strikethrough: true }, href, warnings));
        break;
      case 'inlineCode':
        out.push(...richText(node.value, { ...ctx, code: true }, undefined));
        break;
      case 'link':
        out.push(...toRichText(node.children, ctx, node.url, warnings));
        break;
      case 'image':
        // 行内图片兜底:渲染器不支持段落内嵌图,降级为 alt 文本(块级已在转换器拆出)
        if (node.alt) out.push(...richText(`[${node.alt}]`, ctx, href));
        warnings?.push(`行内图片已降级为文字: ${node.url}`);
        break;
      case 'html':
        warnings?.push(`行内 HTML 已忽略: ${String(node.value).slice(0, 40)}`);
        break;
      default: {
        const kids = (node as any).children as PhrasingContent[] | undefined;
        if (kids) out.push(...toRichText(kids, ctx, href, warnings));
      }
    }
  }
  return out;
}

const CALLOUT_EMOJI: Record<string, string> = {
  note: '💡',
  abstract: '📄',
  summary: '📄',
  tldr: '📄',
  info: 'ℹ️',
  todo: '☑️',
  tip: '🔥',
  hint: '🔥',
  important: '⭐',
  success: '✅',
  check: '✅',
  done: '✅',
  question: '❓',
  help: '❓',
  faq: '❓',
  warning: '⚠️',
  caution: '⚠️',
  attention: '⚠️',
  danger: '🚨',
  error: '🚨',
  failure: '🚨',
  bug: '🐛',
  example: '📌',
  quote: '❝',
  cite: '❝',
};

const CALLOUT_RE = /^\[!(\w+)\]\s*/;

function isVideoUrl(url: string): boolean {
  return /youtu\.?be/i.test(url) || /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
}

// Notion code.language 枚举为全小写(2026-10 实测 API 校验报错确认),只能取以下集合内的值;
// 未收录的语言一律降级 'plain text',避免 validation_error 中断整次发布。
const CODE_LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  javascript: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  node: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  tsx: 'typescript',
  py: 'python',
  python: 'python',
  sh: 'shell',
  bash: 'bash',
  shell: 'shell',
  zsh: 'shell',
  powershell: 'powershell',
  ps1: 'powershell',
  json: 'json',
  json5: 'json',
  html: 'html',
  xml: 'xml',
  css: 'css',
  scss: 'scss',
  less: 'less',
  sass: 'sass',
  yml: 'yaml',
  yaml: 'yaml',
  md: 'markdown',
  markdown: 'markdown',
  sql: 'sql',
  java: 'java',
  c: 'c',
  h: 'c',
  cpp: 'c++',
  'c++': 'c++',
  cc: 'c++',
  cs: 'c#',
  csharp: 'c#',
  go: 'go',
  golang: 'go',
  rust: 'rust',
  rs: 'rust',
  php: 'php',
  ruby: 'ruby',
  rb: 'ruby',
  swift: 'swift',
  kotlin: 'kotlin',
  kt: 'kotlin',
  dart: 'dart',
  diff: 'diff',
  patch: 'diff',
  docker: 'docker',
  dockerfile: 'docker',
  graphql: 'graphql',
  gql: 'graphql',
  toml: 'toml',
  makefile: 'makefile',
  make: 'makefile',
  latex: 'latex',
  tex: 'latex',
  mermaid: 'mermaid',
  solidity: 'solidity',
  lua: 'lua',
  perl: 'perl',
  erlang: 'erlang',
  elixir: 'elixir',
  ex: 'elixir',
  haskell: 'haskell',
  hs: 'haskell',
  scala: 'scala',
  clojure: 'clojure',
  lisp: 'lisp',
  ocaml: 'ocaml',
  pascal: 'pascal',
  fortran: 'fortran',
  matlab: 'matlab',
  r: 'r',
  nix: 'nix',
  assembly: 'assembly',
  asm: 'assembly',
  webassembly: 'webassembly',
  wasm: 'webassembly',
  abap: 'abap',
  coffeescript: 'coffeescript',
  prolog: 'prolog',
  scheme: 'scheme',
  smalltalk: 'smalltalk',
  verilog: 'verilog',
  vhdl: 'vhdl',
};

/** mdast 代码语言别名 → Notion code.language 枚举(全小写);未知语言降级 plain text。 */
export function mapCodeLanguage(lang: string | null | undefined): string {
  if (!lang) return 'plain text';
  return CODE_LANGUAGE_MAP[lang.toLowerCase()] || 'plain text';
}

function makeBlock(type: string, data: Record<string, any>): NotionBlock {
  return { object: 'block', type, [type]: data };
}

/** 列表递归拍平:嵌套子列表成为同级连续块,保证渲染器(不递归)也能完整显示。 */
function flattenList(
  node: Extract<RootContent, { type: 'list' }>,
  warnings: string[],
): NotionBlock[] {
  const blocks: NotionBlock[] = [];
  const itemType = node.ordered ? 'numbered_list_item' : 'bulleted_list_item';
  for (const item of node.children) {
    const rich: NotionRichText[] = [];
    const nested: RootContent[] = [];
    for (const child of item.children) {
      if (child.type === 'list') {
        nested.push(child as RootContent);
        continue;
      }
      if (child.type === 'paragraph') {
        rich.push(...toRichText(child.children, NO_ANNOTATION, undefined, warnings));
      } else if (child.type === 'code') {
        nested.push(child);
      } else if (child.type === 'blockquote' || child.type === 'heading' || child.type === 'table') {
        nested.push(child);
      }
    }
    if (rich.length === 0) rich.push(...richText(''));
    blocks.push(makeBlock(itemType, { rich_text: rich }));
    // 嵌套结构拍平为同级块
    for (const child of nested) {
      if (child.type === 'list') {
        blocks.push(...flattenList(child, warnings));
      } else {
        blocks.push(...convertBlock(child, warnings));
      }
    }
  }
  return blocks;
}

/** Obsidian callout 识别:`> [!note] 标题` → { emoji, 标题, 其余段落 rich_text 数组 }。 */
function parseCallout(
  node: Extract<RootContent, { type: 'blockquote' }>,
  warnings: string[],
): { emoji: string; richText: NotionRichText[] } | null {
  const first = node.children[0];
  if (!first || first.type !== 'paragraph') return null;
  const firstText = first.children.find((c) => c.type === 'text') as any;
  if (!firstText || typeof firstText.value !== 'string') return null;
  const match = CALLOUT_RE.exec(firstText.value);
  if (!match) return null;

  const calloutType = match[1].toLowerCase();
  const emoji = CALLOUT_EMOJI[calloutType] || '💡';
  const titleLine = firstText.value.slice(match[0].length).trim();

  // 首行剩余部分 + 后续行/后续段落全部并入 callout 正文(rich_text 支持 \n)
  const parts: NotionRichText[] = [];
  if (titleLine) parts.push(...richText(titleLine, { ...NO_ANNOTATION, bold: true }));

  const remainingFirstLine = firstText.value.split('\n').slice(1).join('\n');
  if (remainingFirstLine.trim()) {
    parts.push(...richText(remainingFirstLine.trim(), NO_ANNOTATION));
  }
  // paragraph 内其他节点(粗体等行内样式)
  const others = first.children.filter((c) => c !== firstText);
  if (others.length) parts.push(...toRichText(others as PhrasingContent[], NO_ANNOTATION, undefined, warnings));

  for (const child of node.children.slice(1)) {
    if (child.type === 'paragraph') {
      if (parts.length) parts.push(...richText('\n'));
      parts.push(...toRichText(child.children, NO_ANNOTATION, undefined, warnings));
    } else {
      warnings.push(`callout 内的 ${child.type} 块已降级为纯文本段落`);
      if (child.type === 'code') {
        if (parts.length) parts.push(...richText('\n'));
        parts.push(...richText((child as any).value, NO_ANNOTATION));
      }
    }
  }
  return { emoji, richText: parts };
}

/** 表格 → table 块 + table_row 子块(Notion API 支持嵌套 children 深度 1)。 */
function convertTable(
  node: Extract<RootContent, { type: 'table' }>,
  warnings: string[],
): NotionBlock {
  const rows = node.children; // tableRow[]
  const width = rows[0]?.children.length || 1;
  const rowBlocks = rows.map((row) =>
    makeBlock('table_row', {
      cells: row.children.map((cell: any) => toRichText(cell.children, NO_ANNOTATION, undefined, warnings)),
    }),
  );
  return {
    object: 'block',
    type: 'table',
    table: {
      table_width: width,
      has_column_header: true,
      has_row_header: false,
      children: rowBlocks,
    },
  };
}

/** 单个块级节点转换。 */
function convertBlock(node: RootContent, warnings: string[]): NotionBlock[] {
  switch (node.type) {
    case 'heading': {
      const depth = Math.min(node.depth, 3);
      if (node.depth > 3) {
        warnings.push(`四级及以上标题已降级为三级标题: ${(node.children[0] as any)?.value || ''}`);
      }
      return [
        makeBlock(`heading_${depth}`, {
          rich_text: toRichText(node.children, NO_ANNOTATION, undefined, warnings),
        }),
      ];
    }

    case 'paragraph': {
      const blocks: NotionBlock[] = [];
      // 段落按图片边界拆分:图片独立成块,文本片段各自成段
      const segments: PhrasingContent[][] = [[]];
      for (const child of node.children) {
        if (child.type === 'image') {
          segments.push([child]);
          segments.push([]);
        } else {
          segments[segments.length - 1].push(child);
        }
      }
      for (const seg of segments) {
        if (seg.length === 0) continue;
        if (seg.length === 1 && seg[0].type === 'image') {
          const img = seg[0] as any;
          if (!img.url) continue; // 缺失/防盗链图片已在 rewriteImageUrls 清空并告警
          blocks.push(
            makeBlock('image', {
              type: 'external',
              external: { url: img.url },
              caption: img.alt ? richText(img.alt) : [],
            }),
          );
          continue;
        }
        // 段落只有一个裸链接且是视频 → video 块
        if (seg.length === 1 && seg[0].type === 'link' && isVideoUrl((seg[0] as any).url)) {
          blocks.push(makeBlock('video', { type: 'external', external: { url: (seg[0] as any).url } }));
          continue;
        }
        const rich = toRichText(seg, NO_ANNOTATION, undefined, warnings);
        if (rich.length) blocks.push(makeBlock('paragraph', { rich_text: rich }));
      }
      return blocks;
    }

    case 'code':
      return [
        makeBlock('code', {
          rich_text: richText(node.value),
          language: mapCodeLanguage(node.lang),
        }),
      ];

    case 'blockquote': {
      const callout = parseCallout(node, warnings);
      if (callout) {
        return [makeBlock('callout', { rich_text: callout.richText, icon: { type: 'emoji', emoji: callout.emoji } })];
      }
      // 普通 quote:取首个段落,多段落合并(渲染器 quote 不支持子块)
      const rich: NotionRichText[] = [];
      for (const child of node.children) {
        if (child.type === 'paragraph') {
          if (rich.length) rich.push(...richText('\n'));
          rich.push(...toRichText(child.children, NO_ANNOTATION, undefined, warnings));
        }
      }
      if (rich.length === 0) rich.push(...richText(''));
      return [makeBlock('quote', { rich_text: rich })];
    }

    case 'list':
      return flattenList(node, warnings);

    case 'thematicBreak':
      return [makeBlock('divider', {})];

    case 'table':
      return [convertTable(node, warnings)];

    case 'html':
    case 'footnoteDefinition':
      // parseMarkdown 已就这些语法给出警告,这里静默跳过(math 等走 default 分支统一告警)
      return [];

    case 'definition':
      return [];

    default:
      warnings.push(`不支持的语法块已忽略: ${node.type}`);
      return [];
  }
}

/** mdast 根 → Notion blocks。 */
export function markdownToNotionBlocks(ast: Root): ConvertResult {
  const warnings: string[] = [];
  const blocks: NotionBlock[] = [];
  for (const child of ast.children) {
    blocks.push(...convertBlock(child, warnings));
  }
  return { blocks, warnings };
}

/**
 * Notion API 单次请求 children 上限 100,超出需分批 append。
 * 返回 [首页块(可随 pages.create 一起建), 后续批次]。
 */
export function chunkBlocks(blocks: NotionBlock[], firstChunkSize = 95): NotionBlock[][] {
  if (blocks.length <= firstChunkSize) return [blocks];
  const chunks: NotionBlock[][] = [blocks.slice(0, firstChunkSize)];
  for (let i = firstChunkSize; i < blocks.length; i += 95) {
    chunks.push(blocks.slice(i, i + 95));
  }
  return chunks;
}

/** 从 body markdown 一站式转换(解析已在 parseMarkdown 完成,这里仅转发)。 */
export function convertMarkdownBody(ast: Root): ConvertResult {
  return markdownToNotionBlocks(ast);
}
