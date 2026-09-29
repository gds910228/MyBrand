/**
 * 检索排序与相关性评分（feat-search-discovery-20260928，能力块 C + F）。
 *
 * 三件事：
 * 1. **时效加权**：relevance 排序下给新内容加成（`applyRecencyWeight`）。
 * 2. **确定性排序**：任何排序都以 `id` 升序作为最终 tiebreaker，
 *    保证「同一查询两次调用结果 id 序列完全一致」（验收项 S10）。
 * 3. **相关内容评分**：同类型优先 + 标签相似度（`scoreRelated`），
 *    供能力块 F 的推荐模块与检索层共享同一套评分口径。
 *
 * 纯函数模块：`now` 一律由调用方注入，便于测试与确定性复现。
 */
import type { SearchDoc, SearchHit } from '@/lib/searchIndex';

/** relevance 排序下时效加成的最大相对增幅。 */
export const RECENCY_WEIGHT = 0.3;
/** 时效加成的半衰期（天）：内容越旧，加成越接近 0。 */
export const HALF_LIFE_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/**
 * 排序用的「当前时间」基准（决策 D-08）。
 *
 * 时效因子依赖当前时间，若服务端与客户端各自取 `Date.now()`，同一查询在两侧
 * 理论上可能因毫秒差导致顺序翻转，使 S18（两端 id 序列一致）无法**证明**。
 * 因此统一按**小时取整**作为基准：两侧在同一小时内得到完全相同的值，
 * 仅在小时边界的毫秒内可能不一致（可忽略，已在 spec §8.3 明示）。
 */
export function rankingReferenceTime(now: number = Date.now()): number {
  return Math.floor(now / HOUR_MS) * HOUR_MS;
}

/** 解析 ISO 日期为毫秒时间戳；非法日期返回 0（排到最后而不是崩溃）。 */
export function parseDateMs(date: string | undefined | null): number {
  if (!date) return 0;
  const ms = new Date(date).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * 时效因子 ∈ (0, 1]：越新越接近 1，半衰期处为 0.5。
 * 未来日期（时钟偏差/预发布）夹到 1，不产生超额加成。
 */
export function recencyFactor(date: string, now: number): number {
  const ms = parseDateMs(date);
  if (ms === 0) return 0;
  const ageDays = (now - ms) / DAY_MS;
  if (ageDays <= 0) return 1;
  return Math.exp((-ageDays * Math.LN2) / HALF_LIFE_DAYS);
}

/**
 * 给命中项叠加时效加权，返回**新的**数组（不修改入参）。
 *
 * `finalScore = score * (1 + RECENCY_WEIGHT * recencyFactor)`
 * 原始 `score` 保留在 `baseScore` 字段，便于排查与测试。
 */
export function applyRecencyWeight<T extends SearchHit>(hits: T[], now: number): (T & { baseScore: number })[] {
  return hits.map((h) => {
    const factor = recencyFactor(h.date, now);
    const boosted = h.score * (1 + RECENCY_WEIGHT * factor);
    return { ...h, score: boosted, baseScore: h.score, recencyFactor: factor };
  });
}

export type SortMode = 'relevance' | 'newest';

/**
 * relevance 比较器：分数降序 → 日期降序 → **id 升序**（确定性兜底）。
 * 第三步是关键：MiniSearch 分数相同的文档若只靠前两步，顺序取决于插入顺序，
 * 而插入顺序又取决于上游异步返回顺序，会导致同一查询两次调用结果不一致。
 */
export function compareByRelevance(a: SearchHit, b: SearchHit): number {
  if (b.score !== a.score) return b.score - a.score;
  const d = parseDateMs(b.date) - parseDateMs(a.date);
  if (d !== 0) return d;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** newest 比较器：日期降序 → id 升序（确定性兜底）。 */
export function compareByNewest(a: SearchHit, b: SearchHit): number {
  const d = parseDateMs(b.date) - parseDateMs(a.date);
  if (d !== 0) return d;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** 按指定模式排序，返回新数组。 */
export function sortHits<T extends SearchHit>(hits: T[], mode: SortMode): T[] {
  const cmp = mode === 'newest' ? compareByNewest : compareByRelevance;
  return [...hits].sort(cmp);
}

// ---------------------------------------------------------------------------
// 相关内容评分（能力块 F）
// ---------------------------------------------------------------------------

/** 同类型加成：博客优先推荐博客，项目优先推荐项目。 */
export const SAME_TYPE_BONUS = 5;
/** 标签 Jaccard 相似度权重。 */
export const TAG_JACCARD_WEIGHT = 10;
/** 每个共享标签的额外加成（鼓励共享多个具体标签）。 */
export const SHARED_TAG_BONUS = 1.5;
/** 时效因子在推荐中的权重（远低于检索，避免推荐被新内容霸屏）。 */
export const RELATED_RECENCY_WEIGHT = 0.5;

export interface RelatedScore {
  score: number;
  /** 与当前内容共享的标签（保留候选文档侧原始大小写）。 */
  sharedTags: string[];
  /** 是否同类型。 */
  sameType: boolean;
}

/** 标签归一化：去空白、小写，用于大小写不敏感比较。 */
function normalizeTag(tag: string): string {
  return String(tag || '').trim().toLowerCase();
}

/**
 * 计算候选文档与当前文档的相关性。
 *
 * 评分 = 同类型加成 + 标签 Jaccard × 权重 + 共享标签数 × 加成，
 * 再乘以时效因子（弱权重）。无任何共享标签且类型不同时得分为 0
 * ——调用方应据此过滤掉「不相关」的候选。
 */
export function scoreRelated(current: SearchDoc, candidate: SearchDoc, now: number): RelatedScore {
  const currentTags = new Set((current.keywords || []).map(normalizeTag).filter(Boolean));
  // 候选侧先去重（保留原始大小写用于展示）：否则 ["A","a"] 这类重复标签
  // 会让 sharedTags.length 超过 union.size，Jaccard 突破 1（评审 P2-4）。
  const seenCandidate = new Set<string>();
  const candidateTags = (candidate.keywords || []).filter((t) => {
    const key = normalizeTag(t);
    if (!key || seenCandidate.has(key)) return false;
    seenCandidate.add(key);
    return true;
  });

  const sharedTags = candidateTags.filter((t) => currentTags.has(normalizeTag(t)));

  const union = new Set([...Array.from(currentTags), ...Array.from(seenCandidate)]);
  const jaccard = union.size === 0 ? 0 : sharedTags.length / union.size;

  const sameType = current.type === candidate.type;

  let score = 0;
  if (sameType) score += SAME_TYPE_BONUS;
  score += jaccard * TAG_JACCARD_WEIGHT;
  score += sharedTags.length * SHARED_TAG_BONUS;

  // 完全无关（无共享标签且异类型）→ 0 分，由调用方过滤。
  if (sharedTags.length === 0 && !sameType) score = 0;

  const factor = recencyFactor(candidate.date, now);
  return {
    score: score * (1 + RELATED_RECENCY_WEIGHT * factor),
    sharedTags,
    sameType,
  };
}

export interface RelatedHit extends SearchHit {
  sharedTags: string[];
  sameType: boolean;
}

/**
 * 排出一组相关内容：排除自身 → 打分 → 过滤 0 分 → 排序（确定性）。
 * 返回条目带 `sharedTags` / `sameType`，供 UI 展示推荐理由。
 */
export function rankRelated(
  current: SearchDoc,
  candidates: SearchDoc[],
  now: number,
  limit = 4,
  sameTypeOnly = false,
): RelatedHit[] {
  const scored: RelatedHit[] = [];

  for (const c of candidates) {
    if (c.id === current.id) continue;
    if (sameTypeOnly && c.type !== current.type) continue;
    const { score, sharedTags, sameType } = scoreRelated(current, c, now);
    if (score <= 0) continue;
    scored.push({ ...c, score, matchedFields: [], sharedTags, sameType });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const d = parseDateMs(b.date) - parseDateMs(a.date);
    if (d !== 0) return d;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  return scored.slice(0, Math.max(0, limit));
}
