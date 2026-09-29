import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SUGGEST_LIMIT,
  MAX_SUGGEST_LIMIT,
  buildSuggestions,
  collectCandidates,
} from '@/lib/searchSuggest';
import type { SearchDoc } from '@/lib/searchIndex';

const doc = (id: string, title: string, keywords: string[] = []): SearchDoc => ({
  id,
  type: 'blog',
  refId: id,
  slug: id,
  title,
  excerpt: '',
  keywords,
  date: '2024-01-01T00:00:00.000Z',
});

const DOCS: SearchDoc[] = [
  doc('blog:1', 'Getting Started with Next.js 14', ['nextjs', 'react', 'tutorial']),
  doc('blog:2', 'Next.js 中的服务端渲染与静态生成', ['nextjs', 'ssr']),
  doc('blog:3', 'React 应用性能优化实战', ['react', 'performance']),
  doc('blog:4', 'A Practical Guide to TypeScript Generics', ['typescript']),
];

describe('searchSuggest / 候选词收集', () => {
  it('从标题与标签收集候选，按小写归一化去重', () => {
    const cands = collectCandidates(DOCS);
    expect(cands.has('nextjs')).toBe(true); // 标题 "Next.js" 归一化 + 标签
    expect(cands.has('react')).toBe(true);
  });

  it('过滤英文停用词与过短词', () => {
    const cands = collectCandidates([doc('blog:x', 'The Art of Writing Clean Code')]);
    expect(cands.has('the')).toBe(false);
    expect(cands.has('of')).toBe(false);
    expect(cands.has('art')).toBe(true);
  });

  it('中文标题同时抽取 bigram 与短语本身（短片段）', () => {
    const cands = collectCandidates([doc('blog:y', '服务端渲染')]);
    expect(cands.has('服务')).toBe(true); // bigram
    expect(cands.has('渲染')).toBe(true); // bigram
    expect(cands.has('服务端渲染')).toBe(true); // 短语本身（≤8 字）
  });

  it('过长的中文整段不作为候选（避免整句成为建议词）', () => {
    const long = '这是一段非常长的中文标题内容确实超过了十二个字的上限';
    const cands = collectCandidates([doc('blog:long', long)]);
    expect(cands.has(long)).toBe(false);
    expect(cands.has('这是')).toBe(true); // bigram 仍在
  });

  it('中文前缀 3 字及以上仍能给出建议（评审 P2-8）', () => {
    const docs = [doc('blog:y', '服务端渲染与静态生成')];
    const two = buildSuggestions('服务', docs).map((s) => s.text);
    const three = buildSuggestions('服务端', docs).map((s) => s.text);
    const four = buildSuggestions('服务端渲', docs).map((s) => s.text);

    // 输入「服务」→ 补全出更长的短语
    expect(two).toContain('服务端渲染与静态生成');
    // 改造前：bigram 候选无法被 3 字前缀包含 → 返回空。
    // 现在通过「前缀包含候选」的反向匹配，给出构成该前缀的词。
    expect(three.length).toBeGreaterThan(0);
    expect(three).toContain('服务端渲染与静态生成');
    expect(three).toContain('服务');
    expect(three).toContain('务端');
    expect(four.length).toBeGreaterThan(0);
    expect(four).toContain('端渲');
  });

  it('较短的 CJK 片段会作为完整短语被建议（前缀补全场景）', () => {
    const docs = [doc('blog:y', '服务端渲染')];
    // 「服务端渲染」共 5 字 ≤ 上限，作为整段候选存在
    const out = buildSuggestions('服务端', docs).map((s) => s.text);
    expect(out).toContain('服务端渲染');
  });

  it('标签权重高于标题词（排序时体现）', () => {
    const cands = collectCandidates(DOCS);
    // nextjs 既在标签又在标题，权重取最大值 3
    expect(cands.get('nextjs')!.weight).toBe(3);
  });

  it('同一文档内重复出现只计一次', () => {
    const cands = collectCandidates([doc('blog:z', 'React React React', ['react'])]);
    expect(cands.get('react')!.count).toBe(1);
  });
});

describe('searchSuggest / 生成建议', () => {
  it('英文前缀匹配（词头）', () => {
    const out = buildSuggestions('nex', DOCS);
    expect(out.map((s) => s.text.toLowerCase())).toContain('nextjs');
  });

  it('英文前缀不匹配词中（next 不匹配 context 之类），只匹配词头', () => {
    const out = buildSuggestions('ext', DOCS);
    expect(out.map((s) => s.text.toLowerCase())).not.toContain('nextjs');
  });

  it('中文前缀按包含匹配（中文无词边界）', () => {
    const out = buildSuggestions('渲', DOCS);
    expect(out.map((s) => s.text)).toContain('渲染');
  });

  it('建议词来自索引内容（而非写死数组）', () => {
    const out = buildSuggestions('type', DOCS);
    expect(out.map((s) => s.text.toLowerCase())).toContain('typescript');
    // 索引里没有的内容不会出现
    expect(out.map((s) => s.text.toLowerCase())).not.toContain('machine learning');
  });

  it('前缀本身就是完整词时不重复建议该词', () => {
    const out = buildSuggestions('nextjs', DOCS);
    expect(out.map((s) => s.text.toLowerCase())).not.toContain('nextjs');
  });

  it('按 命中数×权重 降序，同分按字典序（确定性）', () => {
    const out = buildSuggestions('n', DOCS);
    const first = buildSuggestions('n', DOCS);
    expect(out.map((s) => s.text)).toEqual(first.map((s) => s.text));

    const counts = out.map((s) => s.count);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  it('limit 边界：默认值 / clamp 到上限 / 非法值回落默认', () => {
    expect(buildSuggestions('n', DOCS).length).toBeLessThanOrEqual(DEFAULT_SUGGEST_LIMIT);
    expect(buildSuggestions('n', DOCS, 1)).toHaveLength(1);
    expect(buildSuggestions('n', DOCS, 9999).length).toBeLessThanOrEqual(MAX_SUGGEST_LIMIT);
    expect(buildSuggestions('n', DOCS, 0).length).toBeLessThanOrEqual(MAX_SUGGEST_LIMIT);
    expect(buildSuggestions('n', DOCS, -5).length).toBeLessThanOrEqual(MAX_SUGGEST_LIMIT);
  });

  it('空前缀返回空数组', () => {
    expect(buildSuggestions('', DOCS)).toEqual([]);
    expect(buildSuggestions('   ', DOCS)).toEqual([]);
  });

  it('空索引返回空数组（由调用方回落静态热门词）', () => {
    expect(buildSuggestions('next', [])).toEqual([]);
  });

  it('无匹配前缀返回空数组', () => {
    expect(buildSuggestions('zzzzz', DOCS)).toEqual([]);
  });

  it('每项带 text 与 count', () => {
    const out = buildSuggestions('nex', DOCS);
    expect(out[0]).toHaveProperty('text');
    expect(out[0]).toHaveProperty('count');
    expect(out[0].count).toBeGreaterThan(0);
  });
});
