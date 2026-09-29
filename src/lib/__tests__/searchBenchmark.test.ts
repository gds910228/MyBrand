/**
 * 查询质量基准集召回测试（能力块 A 的验收测试）。
 *
 * fixture：`src/lib/__tests__/fixtures/searchBenchmark.json`（12 条：en 4 / zh 4 / mixed 4）
 * 语料：`src/data` 本地 fallback 种子（经 `getSearchDocuments` 走真实适配层）
 *
 * 本测试同时被单元测试（此处）与部署验收（S1–S4）对照使用。
 * 断言的是**真实召回行为**：命中期望文档，且不误召回 `expectNoneOf` 文档。
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createSearchIndex, runSearchAll, type SearchDoc } from '@/lib/searchIndex';
import { getSearchDocuments } from '@/services/searchData';

interface BenchmarkQuery {
  id: string;
  category: 'en' | 'zh' | 'mixed';
  locale: 'en' | 'zh';
  q: string;
  expectAnyOf: string[];
  expectNoneOf: string[];
  expectTopOf: string[];
  note: string;
}

const fixture = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'fixtures/searchBenchmark.json'), 'utf8'),
) as { queries: BenchmarkQuery[] };

describe('搜索质量基准集', () => {
  it('fixture 结构满足要求：12 条，en/zh/mixed 各 4 条', () => {
    expect(fixture.queries).toHaveLength(12);
    const byCat = fixture.queries.reduce<Record<string, number>>((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {});
    expect(byCat).toEqual({ en: 4, zh: 4, mixed: 4 });
    // 每条都必须标注期望命中集合，否则基准集失去意义
    for (const q of fixture.queries) {
      expect(q.expectAnyOf.length, `${q.id} 缺少 expectAnyOf`).toBeGreaterThan(0);
      expect(q.q.trim().length, `${q.id} 查询为空`).toBeGreaterThan(0);
    }
  });

  it('全部 12 条查询均满足召回下界且无误召回（改造后）', async () => {
    const docsByLocale = {
      en: (await getSearchDocuments('en')) as SearchDoc[],
      zh: (await getSearchDocuments('zh')) as SearchDoc[],
    };

    const indexes = {
      en: createSearchIndex(docsByLocale.en),
      zh: createSearchIndex(docsByLocale.zh),
    };

    const failures: string[] = [];

    for (const c of fixture.queries) {
      const ids = runSearchAll(indexes[c.locale], c.q).map((h) => h.id);

      const hitAny = c.expectAnyOf.some((id) => ids.includes(id));
      if (!hitAny) {
        failures.push(
          `[${c.id}] q="${c.q}" locale=${c.locale} 未命中期望文档 ` +
            `expectAnyOf=[${c.expectAnyOf.join(', ')}]，实际=[${ids.join(', ')}]`,
        );
      }

      const forbidden = c.expectNoneOf.filter((id) => ids.includes(id));
      if (forbidden.length > 0) {
        failures.push(
          `[${c.id}] q="${c.q}" locale=${c.locale} 误召回 [${forbidden.join(', ')}]`,
        );
      }
    }

    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('四类查询（英文/中文/中英混合/中文非词头子串）均有确定命中', async () => {
    const zhDocs = (await getSearchDocuments('zh')) as SearchDoc[];
    const enDocs = (await getSearchDocuments('en')) as SearchDoc[];
    const zhIndex = createSearchIndex(zhDocs);
    const enIndex = createSearchIndex(enDocs);

    const idsOf = (idx: ReturnType<typeof createSearchIndex>, q: string) =>
      runSearchAll(idx, q).map((h) => h.id);

    // 英文
    expect(idsOf(enIndex, 'nextjs')).toContain('blog:post-1');
    // 中文词（位于标题中段）
    expect(idsOf(zhIndex, '入门')).toContain('blog:post-1');
    // 中文非词头子串（改造前无法命中，只能词头前缀命中）
    expect(idsOf(zhIndex, '指南')).toContain('blog:post-1');
    expect(idsOf(zhIndex, '渲染')).toContain('blog:post-10');
    expect(idsOf(zhIndex, '性能优化')).toContain('blog:post-12');
    // 中英混合
    expect(idsOf(zhIndex, 'Next.js 入门')).toContain('blog:post-1');
    expect(idsOf(zhIndex, 'TypeScript 泛型')).toContain('blog:post-11');
  });

  it('单字中文查询可用（索引侧保留 unigram）', async () => {
    const zhDocs = (await getSearchDocuments('zh')) as SearchDoc[];
    const zhIndex = createSearchIndex(zhDocs);
    expect(runSearchAll(zhIndex, '渲').map((h) => h.id)).toContain('blog:post-10');
  });
});
