import { describe, it, expect } from 'vitest';
import {
  HALF_LIFE_DAYS,
  RECENCY_WEIGHT,
  applyRecencyWeight,
  compareByNewest,
  compareByRelevance,
  parseDateMs,
  rankingReferenceTime,
  rankRelated,
  recencyFactor,
  scoreRelated,
  sortHits,
} from '@/lib/searchRanking';
import type { SearchDoc, SearchHit } from '@/lib/searchIndex';

const NOW = Date.UTC(2025, 0, 1);
const dayMs = 24 * 60 * 60 * 1000;
const iso = (msFromNow: number) => new Date(NOW - msFromNow).toISOString();

const hit = (id: string, score: number, date: string): SearchHit => ({
  id,
  type: 'blog',
  refId: id,
  slug: id,
  title: id,
  excerpt: '',
  keywords: [],
  date,
  score,
  matchedFields: [],
});

const doc = (id: string, type: 'blog' | 'project', keywords: string[], date = iso(0)): SearchDoc => ({
  id,
  type,
  refId: id,
  slug: id,
  title: id,
  excerpt: '',
  keywords,
  date,
});

describe('searchRanking / 时间工具', () => {
  it('parseDateMs 对非法输入归 0 而非 NaN', () => {
    expect(parseDateMs('not-a-date')).toBe(0);
    expect(parseDateMs('')).toBe(0);
    expect(parseDateMs(undefined)).toBe(0);
    expect(Number.isFinite(parseDateMs('2024-01-01'))).toBe(true);
  });

  it('recencyFactor：越新越接近 1，半衰期处为 0.5，缺失日期为 0', () => {
    expect(recencyFactor(iso(0), NOW)).toBeCloseTo(1, 6);
    expect(recencyFactor(iso(HALF_LIFE_DAYS * dayMs), NOW)).toBeCloseTo(0.5, 6);
    expect(recencyFactor(iso(10 * HALF_LIFE_DAYS * dayMs), NOW)).toBeLessThan(0.01);
    expect(recencyFactor('', NOW)).toBe(0);
  });

  it('recencyFactor：未来日期夹到 1，不产生超额加成', () => {
    expect(recencyFactor(new Date(NOW + 10 * dayMs).toISOString(), NOW)).toBe(1);
  });

  it('rankingReferenceTime 按小时取整（两端一致性的前提）', () => {
    // 取整点后 30 秒作为起点，保证 +3599s 仍落在同一小时（避免跨越整点）
    const t = Date.UTC(2025, 5, 1, 13, 0, 30, 0);
    const bucket = rankingReferenceTime(t);
    expect(bucket % (60 * 60 * 1000)).toBe(0);
    expect(bucket).toBe(Date.UTC(2025, 5, 1, 13, 0, 0, 0));
    // 同一小时内的任意时刻得到同一基准
    expect(rankingReferenceTime(t + 60_000)).toBe(bucket);
    expect(rankingReferenceTime(Date.UTC(2025, 5, 1, 13, 59, 59, 999))).toBe(bucket);
    // 跨到下一小时才改变
    expect(rankingReferenceTime(Date.UTC(2025, 5, 1, 14, 0, 0, 0))).not.toBe(bucket);
  });

  it('applyRecencyWeight 保持基础分并可复现，不修改入参', () => {
    const input = [hit('a', 10, iso(0)), hit('b', 10, iso(365 * dayMs))];
    const frozen = JSON.parse(JSON.stringify(input));
    const out = applyRecencyWeight(input, NOW);

    expect(input).toEqual(frozen); // 未就地修改
    expect(out[0].baseScore).toBe(10);
    // 新内容加成更大
    expect(out[0].score).toBeGreaterThan(out[1].score);
    expect(out[0].score).toBeLessThanOrEqual(10 * (1 + RECENCY_WEIGHT));
    // 确定性：同输入同输出
    expect(applyRecencyWeight(frozen, NOW)).toEqual(out);
  });
});

describe('searchRanking / 确定性排序', () => {
  it('relevance：分数降序', () => {
    const sorted = sortHits([hit('a', 1, iso(0)), hit('b', 3, iso(0)), hit('c', 2, iso(0))], 'relevance');
    expect(sorted.map((h) => h.id)).toEqual(['b', 'c', 'a']);
  });

  it('relevance：完全同分同日期时按 id 升序（确定性兜底）', () => {
    const same = [hit('z', 5, iso(0)), hit('a', 5, iso(0)), hit('m', 5, iso(0))];
    expect(sortHits(same, 'relevance').map((h) => h.id)).toEqual(['a', 'm', 'z']);
    // 交换输入顺序，结果不变
    expect(sortHits([...same].reverse(), 'relevance').map((h) => h.id)).toEqual(['a', 'm', 'z']);
  });

  it('relevance：同分时日期新的在前', () => {
    const sorted = sortHits([hit('old', 5, iso(300 * dayMs)), hit('new', 5, iso(1 * dayMs))], 'relevance');
    expect(sorted.map((h) => h.id)).toEqual(['new', 'old']);
  });

  it('newest：日期降序，同日期按 id 升序', () => {
    const sorted = sortHits(
      [hit('b', 1, iso(10 * dayMs)), hit('a', 9, iso(1 * dayMs)), hit('c', 2, iso(10 * dayMs))],
      'newest',
    );
    expect(sorted.map((h) => h.id)).toEqual(['a', 'b', 'c']);
  });

  it('排序不修改入参', () => {
    const input = [hit('b', 1, iso(0)), hit('a', 2, iso(0))];
    const before = input.map((h) => h.id);
    sortHits(input, 'relevance');
    expect(input.map((h) => h.id)).toEqual(before);
  });

  it('比较器是全序：任意两元素比较结果稳定且反对称', () => {
    const x = hit('a', 5, iso(0));
    const y = hit('b', 5, iso(0));
    expect(compareByRelevance(x, y)).toBeLessThan(0);
    expect(compareByRelevance(y, x)).toBeGreaterThan(0);
    expect(compareByRelevance(x, x)).toBe(0);
    expect(compareByNewest(x, y)).toBeLessThan(0);
  });
});

describe('searchRanking / 相关推荐评分', () => {
  const current = doc('blog:cur', 'blog', ['nextjs', 'react', 'tutorial']);

  it('同类型 + 共享标签得分最高', () => {
    const sameTypeShared = scoreRelated(current, doc('blog:x', 'blog', ['nextjs']), NOW);
    const diffTypeShared = scoreRelated(current, doc('project:y', 'project', ['nextjs']), NOW);
    expect(sameTypeShared.score).toBeGreaterThan(diffTypeShared.score);
    expect(sameTypeShared.sameType).toBe(true);
    expect(sameTypeShared.sharedTags).toEqual(['nextjs']);
  });

  it('共享标签越多得分越高；大小写不敏感', () => {
    const one = scoreRelated(current, doc('blog:a', 'blog', ['NextJS']), NOW);
    const two = scoreRelated(current, doc('blog:b', 'blog', ['nextjs', 'React']), NOW);
    expect(two.score).toBeGreaterThan(one.score);
    expect(one.sharedTags).toEqual(['NextJS']);
  });

  it('候选侧重复标签不会让 Jaccard 突破 1（评审 P2-4）', () => {
    const dup = scoreRelated(current, doc('blog:d', 'blog', ['nextjs', 'NEXTJS', 'Nextjs']), NOW);
    // 仅 3 个标签共享 1 个 → union = {nextjs, react, tutorial} = 3
    expect(dup.sharedTags).toHaveLength(1);
    // 得分上界：同类型 5 + jaccard(1/3)*10 + 1*1.5，再乘时效上界（≤1.5）
    expect(dup.score).toBeLessThanOrEqual((5 + (1 / 3) * 10 + 1.5) * 1.5 + 1e-9);
  });

  it('异类型且无共享标签 → 0 分（调用方据此过滤）', () => {
    const unrelated = scoreRelated(current, doc('project:z', 'project', ['docker']), NOW);
    expect(unrelated.score).toBe(0);
  });

  it('rankRelated 排除自身、过滤 0 分、以 id 兜底确定性', () => {
    const candidates = [
      current, // 自身，应被排除
      doc('blog:a', 'blog', ['nextjs']),
      doc('blog:b', 'blog', ['nextjs']),
      doc('project:z', 'project', ['docker']), // 0 分，应被过滤
    ];
    const ranked = rankRelated(current, candidates, NOW, 10);
    const ids = ranked.map((r) => r.id);
    expect(ids).not.toContain('blog:cur');
    expect(ids).not.toContain('project:z');
    // 同分 → 按 id 升序
    expect(ids).toEqual(['blog:a', 'blog:b']);
    // 可复现
    expect(rankRelated(current, candidates, NOW, 10).map((r) => r.id)).toEqual(ids);
  });

  it('rankRelated 的 sameTypeOnly 只返回同类型', () => {
    const candidates = [doc('blog:a', 'blog', ['nextjs']), doc('project:p', 'project', ['nextjs'])];
    const ranked = rankRelated(current, candidates, NOW, 10, true);
    expect(ranked.map((r) => r.id)).toEqual(['blog:a']);
  });

  it('rankRelated 遵守 limit，limit<=0 返回空', () => {
    const candidates = [doc('blog:a', 'blog', ['nextjs']), doc('blog:b', 'blog', ['react'])];
    expect(rankRelated(current, candidates, NOW, 1)).toHaveLength(1);
    expect(rankRelated(current, candidates, NOW, 0)).toHaveLength(0);
  });

  it('rankRelated 带出推荐理由所需字段', () => {
    const ranked = rankRelated(current, [doc('blog:a', 'blog', ['nextjs'])], NOW, 5);
    expect(ranked[0].sharedTags).toEqual(['nextjs']);
    expect(ranked[0].sameType).toBe(true);
  });
});
