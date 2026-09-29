/**
 * 一次性脚本：采集「检索层隔离基线」（决策 D-05），交付前删除。
 *
 * 目的：端到端基线（改造前 dev server + 空 Key）为 0/12，但那是**两因叠加**
 * （① blog/project 根本没有本地 fallback → 索引为空；② 分词不支持 CJK 非词头子串）。
 * 本脚本固定语料（用改造后的本地 fallback 种子），**只替换检索实现**为改造前的
 * `src/lib/searchIndex.ts`（快照见 baseline/original/），从而把「分词/检索质量」这一因单独隔离出来。
 *
 * 运行：npx vitest run src/lib/__tests__/baseline.original.test.ts --reporter=verbose
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  MINISEARCH_OPTIONS as ORIGINAL_OPTIONS,
  runSearch as runOriginalSearch,
} from '../../../.harness/changes/feat-search-discovery-20260928/baseline/original/searchIndex.original';
import MiniSearch from 'minisearch';
import type { SearchDoc } from '@/lib/searchIndex';
import { getSearchDocuments } from '@/services/searchData';

const FIXTURE = path.resolve(__dirname, 'fixtures/searchBenchmark.json');

interface BenchmarkQuery {
  id: string;
  category: 'en' | 'zh' | 'mixed';
  locale: 'en' | 'zh';
  q: string;
  expectAnyOf: string[];
  expectNoneOf: string[];
}

describe('baseline (改造前检索实现) over 改造后种子语料', () => {
  it('collects recall for all 12 benchmark queries', async () => {
    const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8')) as { queries: BenchmarkQuery[] };

    const enDocs = (await getSearchDocuments('en')) as SearchDoc[];
    const zhDocs = (await getSearchDocuments('zh')) as SearchDoc[];

    const enIndex = new MiniSearch<SearchDoc>(ORIGINAL_OPTIONS);
    enIndex.addAll(enDocs);
    const zhIndex = new MiniSearch<SearchDoc>(ORIGINAL_OPTIONS);
    zhIndex.addAll(zhDocs);

    const lines: string[] = [];
    lines.push(`语料规模: en=${enDocs.length} docs, zh=${zhDocs.length} docs`);
    lines.push(`改造前实现: baseline/original/searchIndex.original.ts (默认分词, prefix+fuzzy)`);
    lines.push('');

    let pass = 0;
    const byCat: Record<string, { pass: number; total: number }> = {};

    for (const c of fixture.queries) {
      const index = c.locale === 'zh' ? zhIndex : enIndex;
      const hits = runOriginalSearch(index, c.q, 50);
      const ids = hits.map((h) => h.id);

      const hitAny = c.expectAnyOf.length === 0 || c.expectAnyOf.some((id) => ids.includes(id));
      const noForbidden = !c.expectNoneOf.some((id) => ids.includes(id));
      const ok = hitAny && noForbidden;
      if (ok) pass++;

      byCat[c.category] = byCat[c.category] || { pass: 0, total: 0 };
      byCat[c.category].total++;
      if (ok) byCat[c.category].pass++;

      lines.push(
        `[${ok ? 'PASS' : 'FAIL'}] ${c.id} (${c.category}) q="${c.q}" locale=${c.locale}`,
      );
      lines.push(`       hits=${ids.length} ids=[${ids.join(', ')}]`);
      lines.push(
        `       expectAnyOf=[${c.expectAnyOf.join(', ')}] -> ${hitAny ? '满足' : '未满足'}` +
          `  | expectNoneOf -> ${noForbidden ? 'OK' : '误召回'}`,
      );
    }

    lines.push('');
    lines.push(`===== BASELINE SUMMARY: ${pass}/${fixture.queries.length} =====`);
    lines.push(`by category: ${JSON.stringify(byCat)}`);
    lines.push('');

    // 关键：改造前的 zh / mixed 召回应显著低于改造后；
    // 这里只记录，不做断言（本脚本的产物是数值，不是门禁）。
    // eslint-disable-next-line no-console
    console.log(lines.join('\n'));

    const outPath = path.resolve(
      __dirname,
      '../../../.harness/changes/feat-search-discovery-20260928/baseline/baseline_retrieval_isolated.txt',
    );
    fs.writeFileSync(outPath, lines.join('\n'));

    expect(fixture.queries.length).toBe(12);
  });
});
