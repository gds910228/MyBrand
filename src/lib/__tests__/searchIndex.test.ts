import { describe, it, expect } from 'vitest';
import {
  MAX_QUERY_LENGTH,
  createSearchIndex,
  highlight,
  normalizeQuery,
  runSearch,
  runSearchAll,
  serializeIndex,
  loadSerializedIndex,
  type SearchDoc,
} from '@/lib/searchIndex';

const doc = (
  id: string,
  title: string,
  excerpt = '',
  keywords: string[] = [],
  date = '2024-01-01T00:00:00.000Z',
): SearchDoc => ({
  id,
  type: id.startsWith('project:') ? 'project' : 'blog',
  refId: id.split(':')[1],
  slug: id.replace(':', '-'),
  title,
  excerpt,
  keywords,
  date,
});

const DOCS: SearchDoc[] = [
  doc('blog:post-1', 'Next.js 14 入门指南', '学习如何设置新的Next.js项目', ['nextjs', 'react']),
  doc('blog:post-10', 'Next.js 中的服务端渲染与静态生成', '对比 SSR 与 SSG', ['nextjs', 'ssr']),
  doc('blog:post-12', 'React 应用性能优化实战', '先测量再优化', ['react', 'performance']),
  doc('blog:post-4', '在科技行业发展职业：我的旅程', '回顾我从初学者到专业开发者的道路', ['career']),
  doc('project:proj-3', 'E-Commerce Microservices', 'containerised services', ['Docker', 'Node.js']),
];

const index = createSearchIndex(DOCS);
const ids = (q: string) => runSearchAll(index, q).map((h) => h.id);

describe('searchIndex / CJK 检索质量', () => {
  it('中文词命中标题中段', () => {
    expect(ids('入门')).toEqual(['blog:post-1']);
  });

  it('中文非词头子串命中（改造前只能词头前缀命中）', () => {
    expect(ids('指南')).toContain('blog:post-1');
    expect(ids('渲染')).toContain('blog:post-10');
    expect(ids('性能优化')).toContain('blog:post-12');
  });

  it('中英混合查询要求两种 token 同时命中同一文档', () => {
    expect(ids('Next.js 入门')).toEqual(['blog:post-1']);
    expect(ids('React 性能优化')).toEqual(['blog:post-12']);
  });

  it('英文检索与标点归一化', () => {
    expect(ids('nextjs')).toEqual(expect.arrayContaining(['blog:post-1', 'blog:post-10']));
    expect(ids('docker')).toEqual(['project:proj-3']);
  });

  it('单字中文查询可召回（索引侧 unigram）', () => {
    expect(ids('渲')).toContain('blog:post-10');
  });

  it('无关注释不被误召回', () => {
    expect(ids('入门')).not.toContain('blog:post-4');
    expect(ids('性能优化')).not.toContain('blog:post-4');
  });

  it('空查询与纯标点查询返回空数组', () => {
    for (const q of ['', '   ', '!!!', '、。？！']) {
      expect(ids(q), JSON.stringify(q)).toEqual([]);
    }
  });

  it('超长查询被截断且不抛错', () => {
    const long = 'a'.repeat(5000);
    expect(() => ids(long)).not.toThrow();
    expect(normalizeQuery(long)).toHaveLength(MAX_QUERY_LENGTH);
  });

  it('命中项带匹配字段信息', () => {
    const hits = runSearchAll(index, 'nextjs');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].matchedFields.length).toBeGreaterThan(0);
    expect(hits[0].score).toBeGreaterThan(0);
  });
});

describe('searchIndex / runSearch 向后兼容', () => {
  it('runSearch 遵守 limit', () => {
    expect(runSearch(index, 'nextjs', 1)).toHaveLength(1);
    expect(runSearch(index, 'nextjs', 0)).toHaveLength(0);
  });

  it('序列化 / 反序列化后检索结果一致', () => {
    const restored = loadSerializedIndex(serializeIndex(index));
    expect(restored.search('nextjs').map((r) => r.id).sort()).toEqual(
      runSearchAll(index, 'nextjs').map((h) => h.id).sort(),
    );
  });
});

describe('searchIndex / highlight 安全性与行为', () => {
  it('转义 HTML，不产生可执行片段（S12）', () => {
    const out = highlight('<script>alert(1)</script>', '<script>');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;');
  });

  it('只注入 <mark>，其它标签一律转义', () => {
    const out = highlight('Next.js 入门指南 <img src=x onerror=alert(1)>', '入门');
    expect(out).toContain('<mark>入门</mark>');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img');
  });

  it('拉丁词允许字符间分隔符：nextjs 可高亮 Next.js', () => {
    const out = highlight('Next.js 14 入门指南', 'nextjs');
    expect(out).toContain('<mark>Next.js</mark>');
  });

  it('CJK 词整段高亮', () => {
    const out = highlight('Next.js 14 入门指南', '入门');
    expect(out).toContain('<mark>入门</mark>');
  });

  it('空文本返回空串', () => {
    expect(highlight('', 'abc')).toBe('');
  });

  it('snippetRadius 裁剪片段', () => {
    const long = `${'前'.repeat(200)}关键词${'后'.repeat(200)}`;
    const out = highlight(long, '关键词', 20);
    expect(out).toContain('关键词');
    expect(out.length).toBeLessThan(long.length);
  });
});
