/**
 * S18 端到端验证（临时文件，运行后删除）。
 * 对照：服务端 /api/search（完整服务层） vs 客户端命令面板口径
 *      （/api/search/index 下发文档 → 浏览器内 createSearchIndex → rankDocs）。
 * 客户端那一侧直接调用 useSearch 内部所用的同一组函数，因此是真实口径比对。
 */
import { describe, it, expect } from 'vitest';
import { createSearchIndex, type SearchDoc } from '@/lib/searchIndex';
import { defaultParams, rankDocs } from '@/lib/searchPipeline';
import { rankingReferenceTime } from '@/lib/searchRanking';

const BASE = process.env.E2E_BASE || 'http://localhost:3100';
const ip = '10.9.0.30';

async function serverIds(q: string, locale: 'en' | 'zh') {
  const res = await fetch(
    `${BASE}/api/search?q=${encodeURIComponent(q)}&locale=${locale}&pageSize=50`,
    { headers: { 'x-forwarded-for': ip } },
  );
  expect(res.status).toBe(200);
  const json = await res.json();
  return (json.results || []).map((r: any) => r.id);
}

async function clientIds(q: string, locale: 'en' | 'zh') {
  const res = await fetch(`${BASE}/api/search/index?locale=${locale}`, {
    headers: { 'x-forwarded-for': ip },
  });
  expect(res.status).toBe(200);
  const json = (await res.json()) as { documents: SearchDoc[] };
  const docs = json.documents || [];
  const index = createSearchIndex(docs);
  return rankDocs(index, docs, defaultParams({ q, locale }), rankingReferenceTime()).map((h) => h.id);
}

// dev server 首次请求需按需编译路由，冷启动可达数秒；放宽超时避免误报 flaky。
describe('S18 两端口径一致（服务端 API vs 客户端索引口径）', () => {
  const cases: Array<[string, 'en' | 'zh']> = [
    ['nextjs', 'en'],
    ['docker', 'en'],
    ['入门', 'zh'],
    ['渲染', 'zh'],
    ['Next.js 入门', 'zh'],
    ['性能优化', 'zh'],
  ];

  for (const [q, locale] of cases) {
    it(`q="${q}" locale=${locale}`, { timeout: 30000 }, async () => {
      const s = await serverIds(q, locale);
      const c = await clientIds(q, locale);
      expect(s.length).toBeGreaterThan(0);
      expect(s).toEqual(c);
      console.log(`  q="${q}" (${locale}) n=${s.length} ids=[${s.join(', ')}] 两端一致=true`);
    });
  }

  it('索引下发文档数与客户端索引规模一致', { timeout: 30000 }, async () => {
    const res = await fetch(`${BASE}/api/search/index?locale=en`, { headers: { 'x-forwarded-for': ip } });
    const json = await res.json();
    expect(json.count).toBe(json.documents.length);
    expect(json.count).toBeGreaterThan(0);
    console.log(`  index docs=${json.count}`);
  });
});
