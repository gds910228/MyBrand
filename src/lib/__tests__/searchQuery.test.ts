import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  clampPage,
  clampPageSize,
  dayEndMs,
  dayStartMs,
  filterDocs,
  hasTag,
  isValidDateParam,
  matchesFilters,
  paginate,
  parseSearchQuery,
} from '@/lib/searchQuery';
import type { SearchDoc } from '@/lib/searchIndex';

const doc = (
  id: string,
  type: 'blog' | 'project',
  keywords: string[],
  date: string,
): SearchDoc => ({
  id,
  type,
  refId: id,
  slug: id,
  title: id,
  excerpt: '',
  keywords,
  date,
});

const DOCS: SearchDoc[] = [
  doc('blog:a', 'blog', ['nextjs', 'react'], '2024-01-15T00:00:00.000Z'),
  doc('blog:b', 'blog', ['nextjs', 'ssr'], '2024-06-20T00:00:00.000Z'),
  doc('project:c', 'project', ['Docker', 'Node.js'], '2023-11-27T00:00:00.000Z'),
  doc('project:d', 'project', ['docker'], '2024-12-31T23:00:00.000Z'),
];

const sp = (obj: Record<string, string>) => new URLSearchParams(obj);
const parseOk = (obj: Record<string, string>) => {
  const r = parseSearchQuery(sp(obj));
  expect(r.ok, r.error).toBe(true);
  return r.params!;
};

describe('searchQuery / 参数解析', () => {
  it('默认值：空查询 / 不限类型 / relevance / page 1 / pageSize 20', () => {
    const p = parseOk({});
    expect(p).toMatchObject({
      q: '',
      type: null,
      tag: null,
      from: null,
      to: null,
      locale: 'en',
      sort: 'relevance',
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it('解析全部合法参数', () => {
    const p = parseOk({
      q: '  nextjs  ',
      type: 'blog',
      tag: 'React',
      from: '2024-01-01',
      to: '2024-12-31',
      locale: 'zh',
      sort: 'newest',
      page: '3',
      pageSize: '15',
    });
    expect(p.q).toBe('nextjs');
    expect(p.type).toBe('blog');
    expect(p.tag).toBe('React');
    expect(p.from).toBe('2024-01-01');
    expect(p.to).toBe('2024-12-31');
    expect(p.locale).toBe('zh');
    expect(p.sort).toBe('newest');
    expect(p.page).toBe(3);
    expect(p.pageSize).toBe(15);
  });

  it('非法 type → 解析失败（路由层转 400）', () => {
    const r = parseSearchQuery(sp({ type: 'video' }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Invalid type/);
  });

  it('非法 sort → 解析失败', () => {
    const r = parseSearchQuery(sp({ sort: 'random' }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Invalid sort/);
  });

  it('非法日期 → 解析失败；不存在的日期（2024-02-31）也拒绝', () => {
    expect(parseSearchQuery(sp({ from: '2024/01/01' })).ok).toBe(false);
    expect(parseSearchQuery(sp({ to: '2024-13-01' })).ok).toBe(false);
    expect(parseSearchQuery(sp({ from: '2024-02-31' })).ok).toBe(false);
    expect(parseSearchQuery(sp({ from: '2024-02-29' })).ok).toBe(true); // 闰年合法
  });

  it('非法 locale → 回落 en（不报错，保持旧行为）', () => {
    expect(parseOk({ locale: 'fr' }).locale).toBe('en');
  });

  it('兼容旧参数 language=Chinese|English', () => {
    expect(parseOk({ language: 'Chinese' }).locale).toBe('zh');
    expect(parseOk({ language: 'English' }).locale).toBe('en');
    // locale 优先于 language
    expect(parseOk({ locale: 'en', language: 'Chinese' }).locale).toBe('en');
  });

  it('超长 q 被截断到上限', () => {
    expect(parseOk({ q: 'x'.repeat(1000) }).q).toHaveLength(200);
  });

  it('接受 Next.js 的 searchParams 对象（含数组值）', () => {
    const p = parseSearchQuery({ q: ['nextjs', 'ignored'], type: 'blog' });
    expect(p.ok).toBe(true);
    expect(p.params!.q).toBe('nextjs');
    expect(p.params!.type).toBe('blog');
  });
});

describe('searchQuery / 数值参数容错（不报错，只 clamp）', () => {
  it('pageSize 边界', () => {
    expect(clampPageSize(null)).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPageSize('')).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPageSize('abc')).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPageSize('0')).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPageSize('-5')).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPageSize('1.5')).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPageSize('10')).toBe(10);
    expect(clampPageSize('9999')).toBe(MAX_PAGE_SIZE);
  });

  it('page 边界', () => {
    expect(clampPage(null)).toBe(1);
    expect(clampPage('0')).toBe(1);
    expect(clampPage('-3')).toBe(1);
    expect(clampPage('x')).toBe(1);
    expect(clampPage('7')).toBe(7);
  });
});

describe('searchQuery / 过滤', () => {
  it('hasTag 大小写不敏感精确匹配', () => {
    expect(hasTag(DOCS[2], 'docker')).toBe(true);
    expect(hasTag(DOCS[2], 'DOCKER')).toBe(true);
    expect(hasTag(DOCS[2], 'dock')).toBe(false); // 不做子串匹配
    expect(hasTag(DOCS[2], '')).toBe(true);
  });

  it('按类型过滤', () => {
    expect(filterDocs(DOCS, parseOk({ type: 'blog' })).map((d) => d.id)).toEqual(['blog:a', 'blog:b']);
    expect(filterDocs(DOCS, parseOk({ type: 'project' })).map((d) => d.id)).toEqual([
      'project:c',
      'project:d',
    ]);
  });

  it('按标签过滤', () => {
    expect(filterDocs(DOCS, parseOk({ tag: 'docker' })).map((d) => d.id)).toEqual([
      'project:c',
      'project:d',
    ]);
    expect(filterDocs(DOCS, parseOk({ tag: 'nextjs' })).map((d) => d.id)).toEqual(['blog:a', 'blog:b']);
  });

  it('按时间范围过滤（含边界）', () => {
    expect(filterDocs(DOCS, parseOk({ from: '2024-01-01', to: '2024-06-30' })).map((d) => d.id)).toEqual([
      'blog:a',
      'blog:b',
    ]);
    // 边界包含：恰好等于 from / to 当日的文档应被包含
    expect(filterDocs(DOCS, parseOk({ from: '2024-01-15', to: '2024-01-15' })).map((d) => d.id)).toEqual([
      'blog:a',
    ]);
    expect(filterDocs(DOCS, parseOk({ to: '2024-12-31' })).map((d) => d.id)).toContain('project:d');
  });

  it('组合过滤同时满足全部条件', () => {
    const p = parseOk({ type: 'project', tag: 'docker', from: '2024-01-01', to: '2024-12-31' });
    expect(filterDocs(DOCS, p).map((d) => d.id)).toEqual(['project:d']);
  });

  it('日期缺失/非法的文档在指定时间范围时被排除', () => {
    const broken = doc('blog:x', 'blog', [], '');
    expect(matchesFilters(broken, parseOk({ from: '2020-01-01' }))).toBe(false);
    // 未指定范围时不受影响
    expect(matchesFilters(broken, parseOk({}))).toBe(true);
  });

  it('dayStartMs / dayEndMs 覆盖整日', () => {
    expect(dayEndMs('2024-01-15') - dayStartMs('2024-01-15')).toBe(24 * 60 * 60 * 1000 - 1);
  });

  it('isValidDateParam 严格校验', () => {
    expect(isValidDateParam('2024-01-01')).toBe(true);
    expect(isValidDateParam('2024-1-1')).toBe(false);
    expect(isValidDateParam('24-01-01')).toBe(false);
    expect(isValidDateParam('2024-00-10')).toBe(false);
    expect(isValidDateParam('2024-04-31')).toBe(false);
  });
});

describe('searchQuery / 分页边界', () => {
  const items = Array.from({ length: 12 }, (_, i) => i + 1);

  it('常规切片与元信息', () => {
    const page = paginate(items, 2, 5);
    expect(page.items).toEqual([6, 7, 8, 9, 10]);
    expect(page).toMatchObject({ total: 12, page: 2, pageSize: 5, totalPages: 3 });
  });

  it('最后一页可能不满', () => {
    expect(paginate(items, 3, 5).items).toEqual([11, 12]);
  });

  it('越界 page 返回空集且不报错', () => {
    const page = paginate(items, 99, 5);
    expect(page.items).toEqual([]);
    expect(page.total).toBe(12);
    expect(page.totalPages).toBe(3);
  });

  it('page=0 / 负数被夹到第 1 页', () => {
    expect(paginate(items, 0, 5).items).toEqual([1, 2, 3, 4, 5]);
    expect(paginate(items, -3, 5).items).toEqual([1, 2, 3, 4, 5]);
  });

  it('空集合：total 0、totalPages 0、items 空', () => {
    const page = paginate([], 1, 5);
    expect(page).toMatchObject({ items: [], total: 0, totalPages: 0 });
    expect(paginate([], 3, 5).items).toEqual([]);
  });

  it('页大小大于总数时单页返回全部', () => {
    const page = paginate(items, 1, 100);
    expect(page.items).toHaveLength(12);
    expect(page.totalPages).toBe(1);
  });
});

describe('searchQuery / 极端与恶意输入（评审 P2-9 补充）', () => {
  it('科学计数法 / Infinity 的数值参数被 clamp，不产生 Infinity 页码', () => {
    expect(clampPage('1e999')).toBe(1);
    expect(clampPageSize('1e999')).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPage('Infinity')).toBe(1);
    expect(clampPageSize('-Infinity')).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPage('NaN')).toBe(1);
  });

  it('负零与浮点页码', () => {
    expect(clampPage('-0')).toBe(1);
    expect(clampPage('2.0')).toBe(DEFAULT_PAGE_SIZE === 20 ? 2 : 2);
    expect(clampPage('2.5')).toBe(1);
  });

  it('全角数字等非 ASCII 数字不被当作整数', () => {
    expect(clampPage('１２')).toBe(1);
    expect(clampPageSize('２０')).toBe(DEFAULT_PAGE_SIZE);
  });

  it('from > to 时过滤结果为空（不报错）', () => {
    const p = parseOk({ from: '2024-12-31', to: '2024-01-01' });
    expect(filterDocs(DOCS, p)).toEqual([]);
  });

  it('含正则元字符的标签按字面量精确匹配（不当作正则）', () => {
    expect(hasTag(DOCS[0], '.*')).toBe(false);
    expect(hasTag(DOCS[0], 'nextjs|react')).toBe(false);
    expect(hasTag(DOCS[0], 'nextjs')).toBe(true);

    const weird = doc('blog:re', 'blog', ['.*'], '2024-01-01T00:00:00.000Z');
    expect(hasTag(weird, '.*')).toBe(true); // 字面量比较
  });

  it('含空字节与换行的查询被安全处理', () => {
    const p = parseOk({ q: 'a\u0000b\nc' });
    expect(typeof p.q).toBe('string');
    expect(p.q.length).toBeGreaterThan(0);
  });

  it('tag 只有空白时视为未指定', () => {
    expect(parseOk({ tag: '   ' }).tag).toBeNull();
  });

  it('超长 tag 不抛错', () => {
    expect(() => parseOk({ tag: 'x'.repeat(5000) })).not.toThrow();
  });
});
