/**
 * CJK 感知分词器（feat-search-discovery-20260928，能力块 A）。
 *
 * 背景：MiniSearch 默认分词按空白与标点切分。中文没有词边界，因此
 * 「Next.js 14 入门指南」会被切成 `["next.js", "14", "入门指南"]` —— 搜「入门」
 * 或「指南」这类**非词头子串**无法命中，只能靠 prefix 匹配从词头前缀命中。
 *
 * 方案（无词典的 bigram + unigram 混合索引，CJK 检索的成熟做法）：
 * - **索引侧**：CJK 连续片段产出 unigram ∪ bigram。
 *   「入门指南」→ `入 门 指 南 | 入门 门指 指南`
 *   unigram 保证单字查询可召回；bigram 保证多字词按序命中。
 * - **查询侧**：CJK 连续片段只产出 bigram（长度 ≥2），长度为 1 时产出该单字。
 *   查询侧不用 unigram 是为了**精度**：否则「入门」会被拆成 `入 OR 门`，
 *   任何含「入」或「门」的文档都会被召回，噪声极大。
 * - 两侧共用同一套片段切分（`segmentText`），保证 token 空间一致。
 *
 * 本文件是纯函数模块，不依赖 MiniSearch / Next.js，便于单测。
 */

/**
 * CJK 码点区间表：Han（基本区 + 扩展 A + 兼容区 + 扩展 B~F 等**增补平面**）、
 * 日文假名、韩文谚文。
 *
 * 用**码点数值**判断而非正则，原因有二：
 * 1. 项目 `tsconfig.target = es5`，正则 `u` 标志（匹配增补平面所必需）不被允许；
 * 2. 数值比较对增补平面（U+20000 起，如港台人名用字「𠮷」「𡃁」）天然正确，
 *    而 `\uXXXX` 形式的字符类只能覆盖 BMP。
 */
const CJK_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x3040, 0x30ff], // 平假名 + 片假名
  [0x3400, 0x4dbf], // CJK 扩展 A
  [0x4e00, 0x9fff], // CJK 基本区
  [0xf900, 0xfaff], // CJK 兼容表意文字
  [0xac00, 0xd7af], // 韩文谚文
  [0x20000, 0x2a6df], // CJK 扩展 B
  [0x2a700, 0x2ebef], // CJK 扩展 C~F
  [0x2f800, 0x2fa1f], // CJK 兼容表意文字增补
];

/** 单个 CJK 片段参与建索引的最大长度，防止超长无空格中文串导致索引膨胀。 */
export const MAX_CJK_RUN_LENGTH = 128;

/**
 * 非 CJK 词的分隔符：凡不是字母/数字的字符都作为边界。
 * 覆盖拉丁字母（含重音）、数字；CJK 已在上一步被单独切走。
 */
const NON_WORD = /[^a-z0-9À-ɏ]+/;

export type SegmentType = 'cjk' | 'word';

export interface Segment {
  type: SegmentType;
  /** cjk → 原始片段（未做任何归一化）；word → 已归一化（小写、去分隔符）。 */
  value: string;
}

/** 字符（完整码点，含增补平面）是否为 CJK。 */
export function isCjkChar(ch: string): boolean {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  if (cp === undefined) return false;
  for (const [lo, hi] of CJK_RANGES) {
    if (cp >= lo && cp <= hi) return true;
  }
  return false;
}

/**
 * 取字符串的**首个完整码点**。
 * 不能直接用 `s[0]`——那会返回 UTF-16 码元，遇到增补平面字符时拿到的是半个代理对，
 * 导致 `isCjkChar` 误判（评审 P2-1 的连带问题）。
 */
function firstCodePoint(s: string): string {
  if (!s) return '';
  const cp = s.codePointAt(0);
  return cp === undefined ? '' : String.fromCodePoint(cp);
}

/**
 * 把文本切成 CJK 片段与拉丁/数字词两类，交替排列、保序。
 *
 * - CJK 片段按「连续 CJK 字符」聚合，保留原样（不做大小写/标点处理）。
 * - 非 CJK 片段先按既有搜索口径归一化（小写 + 去掉 `._/-`，使 `Next.js` 与 `nextjs`
 *   产出同一 token `nextjs`），再按非字母数字边界切词。
 *   注意：`Next JS`（空格分隔）产出两个 token `next` / `js`，与 `nextjs` 并非同一 token；
 *   但在 AND 检索下配合 `prefix: true`（`next` 前缀命中 `nextjs`）仍可召回同一文档。
 */
export function segmentText(text: string): Segment[] {
  if (!text) return [];
  const segments: Segment[] = [];
  let buf = '';
  let bufIsCjk: boolean | null = null;

  const flush = () => {
    if (!buf) return;
    if (bufIsCjk) {
      // 按**码点**截断而非 UTF-16 码元：否则会把增补平面的代理对从中间劈开。
      segments.push({
        type: 'cjk',
        value: Array.from(buf).slice(0, MAX_CJK_RUN_LENGTH).join(''),
      });
    } else {
      // 与旧实现保持一致：先去掉连接符再切词，使 "next.js" → "nextjs"。
      const normalized = buf.toLowerCase().replace(/[._/-]/g, '');
      for (const w of normalized.split(NON_WORD)) {
        if (w) segments.push({ type: 'word', value: w });
      }
    }
    buf = '';
  };

  for (const ch of text) {
    const isCjk = isCjkChar(ch);
    if (bufIsCjk === null || isCjk === bufIsCjk) {
      buf += ch;
      bufIsCjk = isCjk;
      continue;
    }
    flush();
    buf = ch;
    bufIsCjk = isCjk;
  }
  flush();

  return segments;
}

/** 取一个 CJK 片段的 unigram（逐字）。 */
export function cjkUnigrams(run: string): string[] {
  return Array.from(run);
}

/** 取一个 CJK 片段的 bigram（相邻两字）。长度 <2 时返回空数组。 */
export function cjkBigrams(run: string): string[] {
  const chars = Array.from(run);
  const out: string[] = [];
  for (let i = 0; i + 1 < chars.length; i++) {
    out.push(chars[i] + chars[i + 1]);
  }
  return out;
}

/**
 * 通用 token 切分（索引侧与查询侧共用）：产出**片段级** token，
 * 尚未做 CJK 的 n-gram 展开。展开由 `expandForIndex` / `expandForQuery` 完成。
 */
export function tokenizeText(text: string): string[] {
  return segmentText(text).map((s) => s.value);
}

/**
 * 索引侧展开：CJK 片段 → unigram ∪ bigram；普通词原样保留。
 * 作为 MiniSearch 的 `processTerm`（可返回 `string[]`）。
 */
export function expandForIndex(term: string): string[] {
  if (!term) return [];
  // 片段级 token 只可能是「纯 CJK 片段」或「纯拉丁数字词」二选一。
  if (!isCjkChar(firstCodePoint(term))) return [term];
  const chars = Array.from(term);
  if (chars.length === 1) return chars;
  // 去重：重复字（如「谢谢」→ unigram 谢 只留一个）不重复入索引。
  return Array.from(new Set([...chars, ...cjkBigrams(term)]));
}

/**
 * 查询侧展开：CJK 片段 → bigram（长度 ≥2）；单字片段 → 该单字。
 * 返回空数组表示该 token 不参与检索（由调用方过滤）。
 */
export function expandForQuery(term: string): string[] {
  if (!term) return [];
  if (!isCjkChar(firstCodePoint(term))) return [term];
  const chars = Array.from(term);
  if (chars.length === 1) return chars;
  return cjkBigrams(term);
}

/**
 * 把查询文本展开为用于检索的 token 列表（查询侧口径）。
 * 供建议端点、高亮与检索一致性测试复用。
 */
export function queryTokens(query: string): string[] {
  const out: string[] = [];
  for (const seg of segmentText(query)) {
    out.push(...expandForQuery(seg.value));
  }
  return out;
}

/**
 * 把查询文本还原为「原始词面」列表，供高亮使用：
 * CJK 片段保持整段（如「入门指南」），拉丁词保持归一化形式（如 `nextjs`）。
 * 与 `queryTokens` 的区别：不做 bigram 拆解，避免把「入门指南」高亮成 4 段碎片。
 */
export function queryHighlightTerms(query: string): string[] {
  return Array.from(new Set(segmentText(query).map((s) => s.value).filter(Boolean)));
}
