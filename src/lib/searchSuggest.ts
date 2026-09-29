/**
 * 搜索建议（feat-search-discovery-20260928，T12；能力块 D）。
 *
 * 替代改造前写死的 `popularSearches` 静态数组：建议词**来自当前索引内容**
 * （文档标题 + 标签/技术栈），因此随内容变化自动更新。
 * 静态热门词保留为**兜底**（索引为空或前缀为空时使用）。
 *
 * 匹配规则（中英文差异）：
 * - 非 CJK 前缀：**词头前缀匹配**（`nex` → `nextjs`），符合英文输入习惯；
 * - CJK 前缀：中文无词边界，改判**包含**（`入` → `入门`），否则「入门」永远无法被建议出来。
 *
 * 纯函数模块：不碰存储/网络，便于单测。
 */
import { segmentText } from '@/lib/cjkTokenizer';
import type { SearchDoc } from '@/lib/searchIndex';
import type { SearchSuggestion } from '@/types/search';

/** 默认建议条数。 */
export const DEFAULT_SUGGEST_LIMIT = 8;
/** 建议条数上限。 */
export const MAX_SUGGEST_LIMIT = 20;

/** 英文停用词：作为建议词毫无信息量，且会淹没真正的技术词。 */
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'vs', 'via', 'from', 'into', 'that', 'this',
  'your', 'you', 'are', 'how', 'what', 'when', 'why', 'not', 'but', 'its',
  'a', 'an', 'of', 'to', 'in', 'on', 'at', 'is', 'it', 'be', 'as', 'by', 'or',
]);

/** 候选词权重：标签/技术栈比标题词更能代表内容主题。 */
const KEYWORD_WEIGHT = 3;
const TITLE_WEIGHT = 2;

interface Candidate {
  /** 展示用词面（保留原始大小写）。 */
  text: string;
  /** 归一化后的比较键。 */
  key: string;
  weight: number;
  count: number;
  /** 已计入 count 的文档 id，保证「同一文档内重复出现只计一次」。 */
  seen: Set<string>;
}

/** 从标题里抽取候选英文词（长度 ≥3、非停用词）。 */
function titleWords(title: string): string[] {
  const out: string[] = [];
  for (const seg of segmentText(title)) {
    if (seg.type !== 'word') continue;
    if (seg.value.length < 3) continue;
    if (STOPWORDS.has(seg.value)) continue;
    out.push(seg.value);
  }
  return out;
}

/**
 * 从标题里抽取候选中文词。
 *
 * 产出两类：
 * - **bigram**（相邻两字）：中文无词边界时的通用切分，保证任意 2 字查询可被建议；
 * - **整段短片段**（长度 2..MAX_CJK_TERM_LENGTH，上限 12 字，约一个中文短语的长度）：中文短语建议往往是完整词
 *   （如「服务端渲染」）。若只产出 bigram，用户输入到第 3 个字（「服务端」）时
 *   将匹配不到任何候选——这是评审 P2-8 指出的真实缺陷。
 *   过长的整段（> MAX）不作为候选，避免整句成为建议词。
 */
const MAX_CJK_TERM_LENGTH = 12;

function titleCjkTerms(title: string): string[] {
  const out: string[] = [];
  for (const seg of segmentText(title)) {
    if (seg.type !== 'cjk') continue;
    const chars = Array.from(seg.value);
    if (chars.length === 1) {
      out.push(seg.value);
      continue;
    }
    if (chars.length <= MAX_CJK_TERM_LENGTH) out.push(seg.value);
    for (let i = 0; i + 1 < chars.length; i++) out.push(chars[i] + chars[i + 1]);
  }
  return out;
}

/**
 * 从索引文档构建候选词表。
 * 同一词面（大小写不敏感）只保留一份，权重取最大值，count 累加命中文档数。
 */
export function collectCandidates(docs: SearchDoc[]): Map<string, Candidate> {
  const candidates = new Map<string, Candidate>();

  const add = (text: string, weight: number, docKey: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    const existing = candidates.get(key);
    if (existing) {
      existing.weight = Math.max(existing.weight, weight);
      // 用 Set 语义去重：同一文档内重复出现只计一次
      if (!existing.seen.has(docKey)) {
        existing.seen.add(docKey);
        existing.count += 1;
      }
      return;
    }
    candidates.set(key, {
      text: trimmed,
      key,
      weight,
      count: 1,
      seen: new Set([docKey]),
    });
  };

  for (const doc of docs) {
    const docKey = doc.id;
    for (const kw of doc.keywords || []) add(String(kw), KEYWORD_WEIGHT, docKey);
    for (const w of titleWords(doc.title || '')) add(w, TITLE_WEIGHT, docKey);
    for (const t of titleCjkTerms(doc.title || '')) add(t, TITLE_WEIGHT, docKey);
  }

  return candidates;
}

/** CJK 判定：只要前缀里含 CJK 字符，就按「包含」匹配；否则按词头匹配。 */
function hasCjk(text: string): boolean {
  return segmentText(text).some((s) => s.type === 'cjk');
}

/**
 * 基于索引内容生成前缀建议。
 *
 * @param prefix 用户已输入的前缀（已 trim）
 * @param docs   当前语言的索引文档集
 * @param limit  返回条数（1..MAX_SUGGEST_LIMIT，超出自动 clamp）
 */
export function buildSuggestions(
  prefix: string,
  docs: SearchDoc[],
  limit: number = DEFAULT_SUGGEST_LIMIT,
): SearchSuggestion[] {
  const needle = prefix.trim().toLowerCase();
  if (!needle) return [];

  const safeLimit = Math.min(Math.max(1, Math.floor(limit) || DEFAULT_SUGGEST_LIMIT), MAX_SUGGEST_LIMIT);
  const containsMode = hasCjk(needle);

  const all = Array.from(collectCandidates(docs).values());

  const matched = all.filter((c) => {
    // 前缀本身就是完整词时不重复建议同一个词
    if (c.key === needle) return false;
    if (containsMode) {
      // CJK：候选包含前缀（用户还在补全）**或**前缀包含候选（用户已打过候选，
      // 如输入「服务端」时应建议出「服务」/「务端」这类构成词）。
      return c.key.includes(needle) || (c.key.length >= 2 && needle.includes(c.key));
    }
    return c.key.startsWith(needle);
  });

  matched.sort((a, b) => {
    const sa = a.count * a.weight;
    const sb = b.count * b.weight;
    if (sb !== sa) return sb - sa;
    // 确定性兜底：同权重按词面字典序
    return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
  });

  return matched.slice(0, safeLimit).map((c) => ({ text: c.text, count: c.count }));
}
