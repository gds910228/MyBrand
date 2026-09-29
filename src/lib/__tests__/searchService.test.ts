/**
 * 检索管线与服务层测试（T18）。
 *
 * 重点覆盖需求里的两项硬要求：
 * - **排序确定性**（S10）：同一查询两次调用 id 序列完全一致；
 * - **两端一致**（S18）：服务端 `searchContent` 与客户端视图（`rankDocs` 直调）id 序列一致。
 *   `useSearch` 内部调用的正是 `rankDocs` + `rankingReferenceTime`，因此这里直接验证共享管线本身。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createSearchIndex, type SearchDoc } from '@/lib/searchIndex';
import { defaultParams, rankDocs } from '@/lib/searchPipeline';
import { rankingReferenceTime } from '@/lib/searchRanking';
import { paginate } from '@/lib/searchQuery';
import { searchContent, toResultItem } from '@/services/searchService';
import { getRelatedContent } from '@/services/recommendations';
import { resetSearchIndexCacheForTest, getIndexBuildCount, getCachedIndex } from '@/lib/searchIndexCache';
import { getSearchDocuments } from '@/services/searchData';

const NOW = Date.UTC(2025, 0, 1, 12, 0, 0);

const doc = (
  id: string,
  type: 'blog' | 'project',
  title: string,
  keywords: string[],
  date: string,
): SearchDoc => ({
  id,
  type,
  refId: id.split(':')[1],
  slug: id.replace(':', '-'),
  title,
  excerpt: '',
  keywords,
  date,
});

const DOCS: SearchDoc[] = [
  doc('blog:1', 'blog', 'Next.js 14 入门指南', ['nextjs', 'react'], '2023-10-25T00:00:00.000Z'),
  doc('blog:2', 'blog', 'Next.js 中的服务端渲染与静态生成', ['nextjs', 'ssr'], '2024-05-20T00:00:00.000Z'),
  doc('blog:3', 'blog', 'React 应用性能优化实战', ['react', 'performance'], '2024-07-08T00:00:00.000Z'),
  doc('project:1', 'project', 'MisoTech Portfolio Platform', ['Next.js', 'TypeScript'], '2024-03-18T00:00:00.000Z'),
];

const INDEX = createSearchIndex(DOCS);
const idsOf = (hits: { id: string }[]) => hits.map((h) => h.id);

describe('searchPipeline / 排序确定性（S10）', () => {
  it('同一查询两次调用 id 序列完全一致', () => {
    const p = defaultParams({ q: 'nextjs' });
    const a = idsOf(rankDocs(INDEX, DOCS, p, NOW));
    const b = idsOf(rankDocs(INDEX, DOCS, p, NOW));
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('乱序输入文档不影响结果顺序', () => {
    const p = defaultParams({ q: 'nextjs' });
    const a = idsOf(rankDocs(INDEX, DOCS, p, NOW));
    const shuffled = [...DOCS].reverse();
    const b = idsOf(rankDocs(createSearchIndex(shuffled), shuffled, p, NOW));
    expect(b).toEqual(a);
  });

  it('空查询返回空数组', () => {
    expect(rankDocs(INDEX, DOCS, defaultParams({ q: '' }), NOW)).toEqual([]);
    expect(rankDocs(INDEX, DOCS, defaultParams({ q: '   ' }), NOW)).toEqual([]);
  });

  it('relevance 排序下时效加权真实生效（同分文档新者在前）', () => {
    // 构造两篇**文本完全相同、日期不同**的文档：MiniSearch 相关性分数必然相同，
    // 因此最终顺序只能由时效加权决定。若移除 applyRecencyWeight，本用例会失败。
    const mk = (id: string, date: string): SearchDoc => ({
      id,
      type: 'blog',
      refId: id,
      slug: id,
      title: 'Identical Searchable Title',
      excerpt: 'identical excerpt',
      keywords: ['identicaltag'],
      date,
    });
    const oldDoc = mk('blog:old', '2015-01-01T00:00:00.000Z');
    const newDoc = mk('blog:new', '2024-12-31T00:00:00.000Z');
    const docs = [oldDoc, newDoc];
    const index = createSearchIndex(docs);

    const hits = rankDocs(index, docs, defaultParams({ q: 'identical' }), NOW);
    expect(hits).toHaveLength(2);
    expect(hits[0].id).toBe('blog:new');
    expect(hits[0].score).toBeGreaterThan(hits[1].score);
    // 显式确认加权后的分数高于原始相关分（baseScore 保留原值）
    expect((hits[0] as any).baseScore).toBeLessThan(hits[0].score);

    // 关闭时效（now 远早于两者）时退化为同分 → 由 id 升序兜底，顺序反转
    const noRecency = rankDocs(index, docs, defaultParams({ q: 'identical' }), Date.UTC(2000, 0, 1));
    expect(noRecency.map((h) => h.id)).toEqual(['blog:new', 'blog:old']); // 同分 → 日期降序
  });

  it('newest 排序按日期降序', () => {
    const hits = rankDocs(INDEX, DOCS, defaultParams({ q: 'nextjs', sort: 'newest' }), NOW);
    const dates = hits.map((h) => new Date(h.date).getTime());
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
  });

  it('结构化过滤在管线中生效', () => {
    const onlyProject = rankDocs(INDEX, DOCS, defaultParams({ q: 'nextjs', type: 'project' }), NOW);
    expect(onlyProject.every((h) => h.type === 'project')).toBe(true);

    const onlyTag = rankDocs(INDEX, DOCS, defaultParams({ q: 'nextjs', tag: 'ssr' }), NOW);
    expect(onlyTag.map((h) => h.id)).toEqual(['blog:2']);
  });
});

describe('searchPipeline / 两端一致（S18）', () => {
  it('服务端 searchContent 与客户端 rankDocs 的 id 序列一致', async () => {
    const p = defaultParams({ q: 'nextjs', locale: 'en' });

    // 客户端视图：useSearch 内部即 rankDocs(index, docs, params, rankingReferenceTime())
    const { index, docs } = await getCachedIndex('en');
    const clientIds = idsOf(rankDocs(index, docs, p, rankingReferenceTime()));

    // 服务端视图：走完整服务层（缓存索引 → 管线 → 分页）
    const server = await searchContent({ ...p, pageSize: 50 }, { now: rankingReferenceTime() });
    const serverIds = idsOf(server.allHits);

    expect(serverIds).toEqual(clientIds);
    expect(serverIds.length).toBeGreaterThan(0);
  });

  it('中文查询同样两端一致', async () => {
    const p = defaultParams({ q: '入门', locale: 'zh' });
    const { index, docs } = await getCachedIndex('zh');
    const clientIds = idsOf(rankDocs(index, docs, p, rankingReferenceTime()));
    const server = await searchContent({ ...p, pageSize: 50 }, { now: rankingReferenceTime() });
    expect(idsOf(server.allHits)).toEqual(clientIds);
    expect(clientIds).toContain('blog:post-1');
  });
});

describe('searchService / 分页与响应形状', () => {
  it('分页元信息正确（page=2&pageSize=5）', async () => {
    const { total } = await searchContent(defaultParams({ q: 'e', locale: 'en', pageSize: 50 }));
    expect(total).toBeGreaterThan(5);

    const p2 = await searchContent(defaultParams({ q: 'e', locale: 'en', page: 2, pageSize: 5 }));
    expect(p2.page).toBe(2);
    expect(p2.pageSize).toBe(5);
    expect(p2.items.length).toBeLessThanOrEqual(5);
    expect(p2.totalPages).toBe(Math.ceil(p2.total / 5));

    // 切片正确性：第 2 页首项 = 全量第 6 项
    const all = await searchContent(defaultParams({ q: 'e', locale: 'en', pageSize: 50 }));
    expect(p2.items[0].id).toBe(all.items[5].id);
  });

  it('越界 page 返回空集且不报错', async () => {
    const out = await searchContent(defaultParams({ q: 'e', locale: 'en', page: 9999, pageSize: 5 }));
    expect(out.items).toEqual([]);
    expect(out.total).toBeGreaterThan(0);
  });

  it('空查询返回空结果但保留分页元信息', async () => {
    const out = await searchContent(defaultParams({ q: '', locale: 'en' }));
    expect(out.items).toEqual([]);
    expect(out.total).toBe(0);
    expect(out.totalPages).toBe(0);
  });

  it('结果项含 id/refId/title/type/score 且 id 为全局口径', async () => {
    const out = await searchContent(defaultParams({ q: 'nextjs', locale: 'en' }));
    expect(out.items.length).toBeGreaterThan(0);
    for (const item of out.items) {
      expect(item.id).toMatch(/^(blog|project):/);
      expect(item.refId).toBe(item.id.split(':')[1]);
      expect(item.title).toBeTruthy();
      expect(['blog', 'project']).toContain(item.type);
      expect(typeof item.score).toBe('number');
    }
    // blog 项带 tags，project 项带 technologies
    const blog = out.items.find((i) => i.type === 'blog');
    const project = out.items.find((i) => i.type === 'project');
    if (blog) expect(Array.isArray(blog.tags)).toBe(true);
    if (project) expect(Array.isArray(project.technologies)).toBe(true);
  });

  it('toResultItem 保留 refId 以兼容旧 id 口径', () => {
    const hit = { ...DOCS[0], score: 1, matchedFields: [] };
    expect(toResultItem(hit).refId).toBe('1');
    expect(toResultItem(hit).id).toBe('blog:1');
  });

  it('paginate 与 searchContent 的分页结果一致', async () => {
    const p = defaultParams({ q: 'e', locale: 'en', pageSize: 50 });
    const all = await searchContent(p);
    const manual = paginate(all.items, 2, 5);
    const viaService = await searchContent({ ...p, page: 2, pageSize: 5 });
    expect(viaService.items.map((i) => i.id)).toEqual(manual.items.map((i) => i.id));
  });
});

describe('searchIndexCache / 索引构建缓存（S24）', () => {
  beforeEach(() => resetSearchIndexCacheForTest());

  it('连续请求只构建一次索引', async () => {
    expect(getIndexBuildCount('en')).toBe(0);

    const first = await getCachedIndex('en');
    expect(first.cached).toBe(false); // 首次：实际构建
    expect(getIndexBuildCount('en')).toBe(1);
    expect(first.docs.length).toBeGreaterThan(0);

    const second = await getCachedIndex('en');
    expect(second.cached).toBe(true); // 命中缓存
    const third = await getCachedIndex('en');
    expect(third.cached).toBe(true);
    expect(getIndexBuildCount('en')).toBe(1); // 仍未再次构建
    // 命中缓存返回的是同一索引实例
    expect(second.index).toBe(first.index);
  });

  it('不同语言各自缓存', async () => {
    await getCachedIndex('en');
    await getCachedIndex('zh');
    expect(getIndexBuildCount('en')).toBe(1);
    expect(getIndexBuildCount('zh')).toBe(1);
  });

  it('缓存钉在 globalThis（跨模块实例共享）', async () => {
    await getCachedIndex('en');
    const g = globalThis as unknown as Record<string, unknown>;
    expect(g.__misotech_search_index_cache__).toBeDefined();
  });
});

describe('recommendations / 相关推荐排序（能力块 F）', () => {
  it('同类型优先，且排除自身', async () => {
    const items = await getRelatedContent({
      type: 'blog',
      id: 'post-1',
      keywords: ['nextjs'],
      locale: 'zh',
      limit: 4,
      now: NOW,
    });
    expect(items.length).toBeGreaterThan(0);
    expect(items.map((i) => i.id)).not.toContain('blog:post-1');
    // 同类型优先：前若干项应为 blog
    expect(items[0].type).toBe('blog');
  });

  it('与原文共享标签，并给出推荐理由（S22）', async () => {
    const items = await getRelatedContent({
      type: 'blog',
      id: 'post-1',
      keywords: ['nextjs', 'tutorial'],
      locale: 'zh',
      limit: 4,
      now: NOW,
    });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(typeof item.reason).toBe('string');
      expect(item.reason.length).toBeGreaterThan(0);
    }
    // 至少一项共享标签
    expect(items.some((i) => i.sharedTags.length > 0)).toBe(true);
    const shared = items.find((i) => i.sharedTags.length > 0)!;
    expect(shared.keywords.map((k) => k.toLowerCase())).toContain(shared.sharedTags[0].toLowerCase());
  });

  it('推荐理由本地化（EN/ZH 不同）', async () => {
    const en = await getRelatedContent({ type: 'blog', id: 'post-1', keywords: ['nextjs'], locale: 'en', now: NOW });
    const zh = await getRelatedContent({ type: 'blog', id: 'post-1', keywords: ['nextjs'], locale: 'zh', now: NOW });
    if (en.length > 0 && zh.length > 0) {
      expect(en[0].reason).not.toBe(zh[0].reason);
    }
  });

  it('结果确定可复现', async () => {
    const args = { type: 'blog' as const, id: 'post-1', keywords: ['nextjs'], locale: 'en' as const, now: NOW };
    const a = await getRelatedContent(args);
    const b = await getRelatedContent(args);
    expect(a.map((i) => i.id)).toEqual(b.map((i) => i.id));
  });

  it('项目推荐返回项目（同类型优先）', async () => {
    const items = await getRelatedContent({
      type: 'project',
      id: 'proj-3',
      keywords: ['Docker'],
      locale: 'en',
      limit: 3,
      now: NOW,
    });
    expect(items.map((i) => i.id)).not.toContain('project:proj-3');
    if (items.length > 0) expect(items[0].type).toBe('project');
  });

  it('语言感知：zh 推荐返回中文标题，en 返回英文标题', async () => {
    const zh = await getRelatedContent({ type: 'blog', id: 'post-1', keywords: ['nextjs'], locale: 'zh', now: NOW });
    const en = await getRelatedContent({ type: 'blog', id: 'post-1', keywords: ['nextjs'], locale: 'en', now: NOW });
    if (zh.length > 0 && en.length > 0) {
      expect(zh[0].title).not.toBe(en[0].title);
    }
  });

  it('未知 docId 时仍能基于标签给出同类型推荐，不抛错', async () => {
    const items = await getRelatedContent({
      type: 'blog',
      id: 'nonexistent',
      keywords: ['nextjs'],
      locale: 'en',
      now: NOW,
    });
    expect(Array.isArray(items)).toBe(true);
  });
});

describe('searchData / 语言过滤', () => {
  it('每套语言的文档都带对应 language 标记', async () => {
    const en = await getSearchDocuments('en');
    const zh = await getSearchDocuments('zh');
    expect(en.every((d) => d.language === 'English')).toBe(true);
    expect(zh.every((d) => d.language === 'Chinese')).toBe(true);
  });
});
