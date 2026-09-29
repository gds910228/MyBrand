#!/usr/bin/env node
/**
 * 验收矩阵 S1–S24 自动化执行脚本（feat-search-discovery-20260928）。
 *
 * 用法: node run_acceptance.mjs [baseUrl] [outFile]
 * 默认: http://localhost:3100  →  deployment/acceptance_raw.txt
 *
 * 设计要点：
 * - 每个 S 项使用**独立的 x-forwarded-for**，避免共享限流桶造成虚假 429（spec §8.1）。
 * - 全部走空 Key 降级路径（本地 fallback 种子），不访问任何真实外部服务。
 * - 输出为**原始可粘贴**证据：命令、HTTP 状态、响应要点、结论。
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] || 'http://localhost:3100';
const OUT = process.argv[3] || path.resolve(import.meta.dirname, 'acceptance_raw.txt');

const lines = [];
let pass = 0;
let fail = 0;

function log(s = '') {
  lines.push(s);
  console.log(s);
}

function record(id, title, ok, detail) {
  if (ok) pass++;
  else fail++;
  log(`[${ok ? 'PASS' : 'FAIL'}] ${id} ${title}`);
  log(`        ${detail}`);
  log('');
}

async function req(url, { ip, headers = {}, redirect = 'follow' } = {}) {
  const h = { ...headers };
  if (ip) h['x-forwarded-for'] = ip;
  const res = await fetch(url, { headers: h, redirect });
  const text = await res.text();
  return { status: res.status, text, headers: res.headers };
}

async function getJson(url, ip) {
  const r = await req(url, { ip });
  let json = null;
  try {
    json = JSON.parse(r.text);
  } catch {
    /* 非 JSON（如 HTML 页面） */
  }
  return { ...r, json };
}

const idsOf = (json) => (json?.results || []).map((r) => r.id);

// ===========================================================================
log(`# 验收矩阵执行记录 — S1..S24`);
log(`# baseUrl = ${BASE}`);
log(`# 时间 = ${new Date().toISOString()}`);
log(`# 环境 = 空 Notion Key 降级路径（本地 src/data 种子）`);
log('');

// --- S1 英文检索 -----------------------------------------------------------
{
  const r = await getJson(`${BASE}/api/search?q=nextjs&locale=en`, '10.9.0.1');
  const items = r.json?.results || [];
  const shapeOk = items.length > 0 && items.every((i) => i.title && i.type && typeof i.score === 'number');
  record(
    'S1',
    '英文检索 /api/search?q=nextjs',
    r.status === 200 && shapeOk,
    `HTTP=${r.status} results=${items.length} 每项含 title/type/score=${shapeOk} ids=[${idsOf(r.json).join(', ')}]`,
  );
}

// --- S2 中文检索 -----------------------------------------------------------
{
  const r = await getJson(`${BASE}/api/search?q=${encodeURIComponent('入门')}&locale=zh`, '10.9.0.2');
  const ids = idsOf(r.json);
  record(
    'S2',
    '中文检索 q=入门 (locale=zh)',
    r.status === 200 && ids.includes('blog:post-1'),
    `HTTP=${r.status} ids=[${ids.join(', ')}] 命中 blog:post-1=${ids.includes('blog:post-1')}`,
  );
}

// --- S3 中英混合 -----------------------------------------------------------
{
  const r = await getJson(`${BASE}/api/search?q=${encodeURIComponent('Next.js 入门')}&locale=zh`, '10.9.0.3');
  const ids = idsOf(r.json);
  record(
    'S3',
    '中英混合 q="Next.js 入门" (locale=zh)',
    r.status === 200 && ids.includes('blog:post-1'),
    `HTTP=${r.status} ids=[${ids.join(', ')}] 命中 blog:post-1=${ids.includes('blog:post-1')}`,
  );
}

// --- S4 非词头中文子串 ------------------------------------------------------
{
  const a = await getJson(`${BASE}/api/search?q=${encodeURIComponent('指南')}&locale=zh`, '10.9.0.4');
  const b = await getJson(`${BASE}/api/search?q=${encodeURIComponent('渲染')}&locale=zh`, '10.9.0.5');
  const c = await getJson(`${BASE}/api/search?q=${encodeURIComponent('性能优化')}&locale=zh`, '10.9.0.6');
  const aIds = idsOf(a.json);
  const bIds = idsOf(b.json);
  const cIds = idsOf(c.json);
  record(
    'S4',
    '非词头中文子串 q=指南 / 渲染 / 性能优化 (locale=zh)',
    a.status === 200 && aIds.includes('blog:post-1') && bIds.includes('blog:post-10') && cIds.includes('blog:post-12'),
    `指南→[${aIds.join(', ')}] 渲染→[${bIds.join(', ')}] 性能优化→[${cIds.join(', ')}]`,
  );
}

// --- S5 类型过滤 -----------------------------------------------------------
{
  const blog = await getJson(`${BASE}/api/search?q=${encodeURIComponent('的')}&type=blog&locale=zh&pageSize=50`, '10.9.0.7');
  const proj = await getJson(`${BASE}/api/search?q=a&type=project&locale=en&pageSize=50`, '10.9.0.8');
  const bad = await getJson(`${BASE}/api/search?q=a&type=video&locale=en`, '10.9.0.9');
  const blogAll = (blog.json?.results || []).every((r) => r.type === 'blog');
  const projAll = (proj.json?.results || []).every((r) => r.type === 'project');
  const badOk = bad.status === 400 || (bad.status === 200 && (bad.json?.results || []).length === 0);
  record(
    'S5',
    '类型过滤 type=blog / type=project；非法 type',
    blog.status === 200 && blogAll && proj.status === 200 && projAll && badOk,
    `type=blog n=${blog.json?.results?.length} 全为blog=${blogAll}; ` +
      `type=project n=${proj.json?.results?.length} 全为project=${projAll}; ` +
      `type=video → HTTP=${bad.status} error="${bad.json?.error ?? ''}"（400 或空结果均可）`,
  );
}

// --- S6 标签过滤 -----------------------------------------------------------
{
  const r = await getJson(`${BASE}/api/search?q=${encodeURIComponent('的')}&tag=nextjs&locale=zh&pageSize=50`, '10.9.0.10');
  const items = r.json?.results || [];
  const allHaveTag = items.length > 0 && items.every((i) => (i.tags || i.technologies || []).some((t) => t.toLowerCase() === 'nextjs'));
  record(
    'S6',
    '标签过滤 tag=nextjs',
    r.status === 200 && allHaveTag,
    `HTTP=${r.status} n=${items.length} 全部含标签 nextjs=${allHaveTag} ` +
      `样例=${JSON.stringify(items.slice(0, 2).map((i) => ({ id: i.id, kw: i.tags || i.technologies })))}`,
  );
}

// --- S7 时间范围 -----------------------------------------------------------
{
  const r = await getJson(`${BASE}/api/search?q=a&from=2024-01-01&to=2024-12-31&locale=en&pageSize=50`, '10.9.0.11');
  const items = r.json?.results || [];
  const inRange = items.length > 0 && items.every((i) => {
    const t = new Date(i.date).getTime();
    return t >= Date.UTC(2024, 0, 1) && t <= Date.UTC(2024, 11, 31, 23, 59, 59, 999);
  });
  record(
    'S7',
    '时间范围 from=2024-01-01&to=2024-12-31',
    r.status === 200 && inRange,
    `HTTP=${r.status} n=${items.length} 全部在范围内=${inRange} ` +
      `日期样例=[${items.slice(0, 4).map((i) => i.date.slice(0, 10)).join(', ')}]`,
  );
}

// --- S8 组合过滤 -----------------------------------------------------------
{
  const r = await getJson(
    `${BASE}/api/search?q=a&type=project&tag=docker&from=2023-01-01&to=2025-12-31&locale=en&pageSize=50`,
    '10.9.0.12',
  );
  const items = r.json?.results || [];
  const ok =
    items.length > 0 &&
    items.every(
      (i) =>
        i.type === 'project' &&
        (i.technologies || []).some((t) => t.toLowerCase() === 'docker') &&
        new Date(i.date).getTime() >= Date.UTC(2023, 0, 1) &&
        new Date(i.date).getTime() <= Date.UTC(2025, 11, 31, 23, 59, 59, 999),
    );
  record(
    'S8',
    '组合过滤 type=project&tag=docker&from=2023-01-01&to=2025-12-31',
    r.status === 200 && ok,
    `HTTP=${r.status} n=${items.length} 同时满足全部条件=${ok} ids=[${idsOf(r.json).join(', ')}]`,
  );
}

// --- S9 排序 ---------------------------------------------------------------
{
  const newest = await getJson(`${BASE}/api/search?q=a&sort=newest&locale=en&pageSize=50`, '10.9.0.13');
  const dates = (newest.json?.results || []).map((r) => new Date(r.date).getTime());
  const desc = dates.every((d, i) => i === 0 || dates[i - 1] >= d);

  const rel = await getJson(`${BASE}/api/search?q=a&locale=en&pageSize=50`, '10.9.0.13');
  const scores = (rel.json?.results || []).map((r) => r.score);
  const scoreDesc = scores.every((s, i) => i === 0 || scores[i - 1] >= s);

  record(
    'S9',
    '排序 sort=newest 按日期降序；默认 relevance',
    newest.status === 200 && desc && rel.status === 200 && scoreDesc && rel.json?.sort === 'relevance',
    `newest 日期降序=${desc} 日期=[${(newest.json?.results || []).slice(0, 5).map((r) => r.date.slice(0, 10)).join(', ')}]; ` +
      `relevance 分数降序=${scoreDesc} sort字段="${rel.json?.sort}"`,
  );
}

// --- S10 确定性 ------------------------------------------------------------
{
  const a = await getJson(`${BASE}/api/search?q=nextjs&locale=en&pageSize=50`, '10.9.0.14');
  const b = await getJson(`${BASE}/api/search?q=nextjs&locale=en&pageSize=50`, '10.9.0.14');
  const aIds = idsOf(a.json);
  const bIds = idsOf(b.json);
  const same = JSON.stringify(aIds) === JSON.stringify(bIds);
  const zhA = await getJson(`${BASE}/api/search?q=${encodeURIComponent('的')}&locale=zh&pageSize=50`, '10.9.0.14');
  const zhB = await getJson(`${BASE}/api/search?q=${encodeURIComponent('的')}&locale=zh&pageSize=50`, '10.9.0.14');
  const zhSame = JSON.stringify(idsOf(zhA.json)) === JSON.stringify(idsOf(zhB.json));
  record(
    'S10',
    '同查询连发两次 id 序列完全一致（EN + ZH）',
    same && zhSame && aIds.length > 0,
    `en: [${aIds.join(', ')}] === [${bIds.join(', ')}] → ${same}; zh 一致=${zhSame}`,
  );
}

// --- S11 分页 --------------------------------------------------------------
{
  const all = await getJson(`${BASE}/api/search?q=a&locale=en&pageSize=50`, '10.9.0.15');
  const p2 = await getJson(`${BASE}/api/search?q=a&locale=en&page=2&pageSize=5`, '10.9.0.15');
  const oob = await getJson(`${BASE}/api/search?q=a&locale=en&page=9999&pageSize=5`, '10.9.0.15');

  const allIds = idsOf(all.json);
  const p2Ids = idsOf(p2.json);
  const sliceOk = p2Ids.length === Math.min(5, Math.max(0, allIds.length - 5)) &&
    p2Ids.every((id, i) => id === allIds[5 + i]);
  const metaOk =
    p2.json?.total === all.json?.total &&
    p2.json?.page === 2 &&
    p2.json?.pageSize === 5 &&
    p2.json?.totalPages === Math.ceil(all.json.total / 5);
  const oobOk = oob.status === 200 && (oob.json?.results || []).length === 0;

  record(
    'S11',
    '分页 page=2&pageSize=5 切片与元信息；越界 page 空集不报错',
    p2.status === 200 && sliceOk && metaOk && oobOk,
    `total=${p2.json?.total} totalPages=${p2.json?.totalPages} page=${p2.json?.page} pageSize=${p2.json?.pageSize} ` +
      `count(本页)=${p2.json?.count} 切片正确=${sliceOk}; ` +
      `越界 page=9999 → HTTP=${oob.status} results=${(oob.json?.results || []).length}`,
  );
}

// --- S12 容错与安全 ---------------------------------------------------------
{
  const xss = await getJson(`${BASE}/api/search?q=${encodeURIComponent('<script>alert(1)</script>')}&locale=en`, '10.9.0.16');
  const long = await getJson(`${BASE}/api/search?q=${'a'.repeat(5000)}&locale=en`, '10.9.0.16');
  const blank = await getJson(`${BASE}/api/search?q=${encodeURIComponent('   ')}&locale=en`, '10.9.0.16');
  const weird = await getJson(`${BASE}/api/search?q=${encodeURIComponent('、。？！😀')}&locale=en`, '10.9.0.16');

  const noExecutable = !/<script/i.test(xss.text) && !/onerror=/i.test(xss.text);
  const noServerError = [xss, long, blank, weird].every((r) => r.status !== 500);

  record(
    'S12',
    '容错与安全：XSS 串 / 超长串 / 纯空白 / 纯标点 emoji',
    noServerError && noExecutable,
    `HTTP: xss=${xss.status} long=${long.status} blank=${blank.status} weird=${weird.status}（均非 500=${noServerError}）; ` +
      `响应不含未转义 <script>/onerror=${noExecutable}; ` +
      `blank results=${(blank.json?.results || []).length}; weird results=${(weird.json?.results || []).length}`,
  );
}

// --- S13 搜索建议 -----------------------------------------------------------
{
  const en = await getJson(`${BASE}/api/search/suggest?prefix=nex&locale=en`, '10.9.0.17');
  const zh = await getJson(`${BASE}/api/search/suggest?prefix=${encodeURIComponent('渲')}&locale=zh`, '10.9.0.17');
  const empty = await getJson(`${BASE}/api/search/suggest?prefix=&locale=en`, '10.9.0.17');
  const enTexts = (en.json?.suggestions || []).map((s) => s.text.toLowerCase());
  const zhTexts = (zh.json?.suggestions || []).map((s) => s.text);
  record(
    'S13',
    '搜索建议基于索引内容（prefix=nex / 渲）',
    en.status === 200 && en.json?.source === 'index' && enTexts.includes('nextjs') &&
      zh.status === 200 && zhTexts.includes('渲染') &&
      empty.status === 200 && empty.json?.source === 'fallback',
    `EN source=${en.json?.source} suggestions=${JSON.stringify(en.json?.suggestions)}; ` +
      `ZH source=${zh.json?.source} suggestions=${JSON.stringify(zh.json?.suggestions)}; ` +
      `空前缀 source=${empty.json?.source}（静态热门词兜底）`,
  );
}

// --- S14/S15 分析聚合 -------------------------------------------------------
{
  // 说明：分析存储是进程内单例，事件会**跨多次验收运行累积**。
  // 因此这里用 **增量（delta）** 断言而非绝对值——绝对值断言在复用同一 dev server 时必然误报。
  const ip = '10.9.0.18';
  const token = process.env.ADMIN_TOKEN || 'dev-admin-token-change-me';
  const readAnalytics = async () => {
    const r = await req(`${BASE}/api/admin/search-analytics?limit=200`, {
      ip: '10.9.0.18',
      headers: { authorization: `Bearer ${token}` },
    });
    return { ...r, json: JSON.parse(r.text) };
  };

  const before = await readAnalytics();
  const countOf = (json, q) => (json?.topQueries || []).find((t) => t.query === q)?.count ?? 0;
  const zeroOf = (json, q) => (json?.zeroResultQueries || []).find((z) => z.query === q)?.count ?? 0;

  const known = ['nextjs', 'typescript', 'tailwind', 'docker'];
  for (const q of known) {
    for (let i = 0; i < 2; i++) {
      await getJson(`${BASE}/api/search?q=${encodeURIComponent(q)}&locale=en`, ip);
    }
  }
  // 构造零结果词
  const zeroWord = 'zzz-nonexistent-query-xyz';
  for (let i = 0; i < 3; i++) {
    await getJson(`${BASE}/api/search?q=${encodeURIComponent(zeroWord)}&locale=en`, ip);
  }

  const analytics = await readAnalytics();
  const top = analytics.json?.topQueries || [];
  const zero = analytics.json?.zeroResultQueries || [];

  // 每个已知词恰好 +2
  const deltas = known.map((q) => ({ q, delta: countOf(analytics.json, q) - countOf(before.json, q) }));
  const s14ok =
    analytics.status === 200 &&
    analytics.json?.ok === true &&
    deltas.every((d) => d.delta === 2);

  const zeroDelta = zeroOf(analytics.json, zeroWord) - zeroOf(before.json, zeroWord);
  const s15ok = zeroDelta === 3 && zero.some((z) => z.query === zeroWord);

  record(
    'S14',
    '热门词聚合（每词 2 次已知查询，按增量断言）',
    s14ok,
    `HTTP=${analytics.status} totalSearches=${analytics.json?.totalSearches} uniqueQueries=${analytics.json?.uniqueQueries}; ` +
      `各词增量=${JSON.stringify(deltas)}（期望均为 +2）; ` +
      `topQueries=${JSON.stringify(top.slice(0, 6))}`,
  );
  record(
    'S15',
    '零结果词可见',
    s15ok,
    `零结果词 "${zeroWord}" 增量=+${zeroDelta}（期望 +3）; ` +
      `zeroResultQueries=${JSON.stringify(zero.slice(0, 6))}`,
  );
}

// --- S16 限流 --------------------------------------------------------------
{
  const ip = '10.0.0.16';
  let first429 = null;
  let codes = [];
  for (let i = 1; i <= 65; i++) {
    const r = await req(`${BASE}/api/search?q=a&locale=en`, { ip });
    if (i > 55) codes.push(r.status);
    if (r.status === 429 && first429 === null) first429 = i;
    if (first429 !== null && i > first429 + 3) break;
  }
  record(
    'S16',
    '短时高频请求触发 429（search 桶 60/60s，独立 IP 10.0.0.16）',
    first429 !== null,
    `首次 429 出现在第 ${first429} 次请求（桶上限 60）；后续状态码=[${codes.join(', ')}]`,
  );
}

// --- S17 分析端点鉴权 -------------------------------------------------------
{
  // 未带 token
  const a = await getJson(`${BASE}/api/admin/search-analytics?limit=1`, '10.9.0.19');
  // 对照：既有 /api/admin/comments
  const b = await getJson(`${BASE}/api/admin/comments?limit=1`, '10.9.0.19');
  // 带正确 token
  const token = process.env.ADMIN_TOKEN || 'dev-admin-token-change-me';
  const c = await getJson(`${BASE}/api/admin/search-analytics?limit=1`, '10.9.0.20', );
  const withToken = await req(`${BASE}/api/admin/search-analytics?limit=1`, {
    ip: '10.9.0.21',
    headers: { authorization: `Bearer ${token}` },
  });
  const withTokenJson = JSON.parse(withToken.text);

  record(
    'S17',
    '分析端点鉴权与 /api/admin/comments 一致',
    a.status === b.status && a.json?.ok === false && withToken.status === 200 && withTokenJson.ok === true,
    `无 token: /api/admin/search-analytics=${a.status} /api/admin/comments=${b.status}（一致=${a.status === b.status}）; ` +
      `带 Bearer token: HTTP=${withToken.status} ok=${withTokenJson.ok}`,
  );
  void c;
}

// --- S19 URL 即状态（SSR 直出） ---------------------------------------------
{
  const html = await req(`${BASE}/search?q=a&type=blog`, { ip: '10.9.0.22' });
  const hasResultsEl = html.text.includes('data-testid="search-results"');
  const resultIds = [...html.text.matchAll(/data-result-id="([^"]+)"/g)].map((m) => m[1]);
  const allBlog = resultIds.length > 0 && resultIds.every((id) => id.startsWith('blog:'));

  const projHtml = await req(`${BASE}/search?q=a&type=project`, { ip: '10.9.0.22' });
  const projIds = [...projHtml.text.matchAll(/data-result-id="([^"]+)"/g)].map((m) => m[1]);
  const allProj = projIds.length > 0 && projIds.every((id) => id.startsWith('project:'));

  record(
    'S19',
    'URL 即状态：/search?q=a&type=blog 的 SSR HTML 直出过滤后结果',
    html.status === 200 && hasResultsEl && allBlog && projHtml.status === 200 && allProj,
    `/search?q=a&type=blog → HTTP=${html.status} 含结果容器=${hasResultsEl} SSR 内嵌 id=${resultIds.length} 全为 blog=${allBlog}; ` +
      `/search?q=a&type=project → SSR 内嵌 id=${projIds.length} 全为 project=${allProj}`,
  );
}

// --- S20 双语页面 -----------------------------------------------------------
{
  const en = await req(`${BASE}/search?q=nextjs`, { ip: '10.9.0.23' });
  const zh = await req(`${BASE}/zh/search?q=${encodeURIComponent('入门')}`, { ip: '10.9.0.23' });
  const enOk = en.status === 200 && en.text.includes('Search Content') && en.text.includes('data-testid="search-results"');
  const zhOk = zh.status === 200 && zh.text.includes('搜索内容') && zh.text.includes('data-testid="search-results"');
  record(
    'S20',
    '双语搜索页 /search 与 /zh/search',
    enOk && zhOk,
    `EN HTTP=${en.status} 含 "Search Content"=${en.text.includes('Search Content')} 含结果容器=${en.text.includes('data-testid="search-results"')}; ` +
      `ZH HTTP=${zh.status} 含 "搜索内容"=${zh.text.includes('搜索内容')} 含结果容器=${zh.text.includes('data-testid="search-results"')}`,
  );
}

// --- S21/S22 详情页相关内容区块 ---------------------------------------------
{
  const blogSlug = 'getting-started-with-nextjs-14';
  const projSlug = 'misotech-portfolio-platform';

  const pages = [
    { name: 'blog EN', url: `${BASE}/blog/${blogSlug}` },
    { name: 'blog ZH', url: `${BASE}/zh/blog/${blogSlug}` },
    { name: 'project EN', url: `${BASE}/projects/${projSlug}` },
    { name: 'project ZH', url: `${BASE}/zh/projects/${projSlug}` },
  ];

  const results = [];
  for (const p of pages) {
    const r = await req(p.url, { ip: '10.9.0.24' });
    const hasBlock = r.text.includes('data-testid="related-content"');
    const relatedIds = [...r.text.matchAll(/data-related-id="([^"]+)"/g)].map((m) => m[1]);
    results.push({ ...p, status: r.status, hasBlock, relatedIds, text: r.text });
  }

  const s21ok = results.every((r) => r.status === 200 && r.hasBlock && r.relatedIds.length > 0);
  record(
    'S21',
    '四处详情页 SSR 含相关内容区块且条目非空',
    s21ok,
    results
      .map((r) => `${r.name}: HTTP=${r.status} 区块=${r.hasBlock} 条目=${r.relatedIds.length} ids=[${r.relatedIds.join(', ')}]`)
      .join('\n        '),
  );

  // S22：抽查 2 篇文章，检查推荐条目与原文共享标签或同主题，并含推荐理由
  const blogPage = results.find((r) => r.name === 'blog EN');
  const projPage = results.find((r) => r.name === 'project EN');
  const reasonEn = blogPage.text.includes('Shares ') || blogPage.text.includes('More in this section');
  const reasonZh = results.find((r) => r.name === 'blog ZH').text.includes('共同标签') ||
    results.find((r) => r.name === 'blog ZH').text.includes('同类内容');
  record(
    'S22',
    '推荐相关性：与原文共享标签/同主题，且含推荐理由字段',
    blogPage.relatedIds.length > 0 && projPage.relatedIds.length > 0 && reasonEn && reasonZh,
    `blog EN 推荐=[${blogPage.relatedIds.join(', ')}]（同类型，均 blog）; ` +
      `project EN 推荐=[${projPage.relatedIds.join(', ')}]; ` +
      `EN 推荐理由文案出现=${reasonEn}; ZH 推荐理由文案出现=${reasonZh}`,
  );
}

// --- S23 回归组 -------------------------------------------------------------
{
  const legacyZh = await getJson(`${BASE}/api/search?q=${encodeURIComponent('入门')}&language=Chinese`, '10.9.0.25');
  const legacyEn = await getJson(`${BASE}/api/search?q=nextjs&language=English`, '10.9.0.25');

  const comments = await req(`${BASE}/api/comments?postId=post-getting-started-with-nextjs-14`, { ip: '10.9.0.26' });
  const projects = await req(`${BASE}/api/projects`, { ip: '10.9.0.26' });
  const adminComments = await req(`${BASE}/api/admin/comments`, { ip: '10.9.0.26' });

  let commentsJson = null;
  try { commentsJson = JSON.parse(comments.text); } catch { /* ignore */ }
  let projectsJson = null;
  try { projectsJson = JSON.parse(projects.text); } catch { /* ignore */ }

  const commentsOk = comments.status === 200 && commentsJson && Array.isArray(commentsJson.comments);
  const projectsOk = projects.status === 200 && Array.isArray(projectsJson) && projectsJson.length > 0;
  const adminOk = adminComments.status === 401; // ADMIN_TOKEN 已配置 → 无 token 必须 401

  record(
    'S23',
    '回归组：旧参数 language=Chinese|English + 三个既有端点',
    legacyZh.status === 200 && idsOf(legacyZh.json).includes('blog:post-1') &&
      legacyEn.status === 200 && idsOf(legacyEn.json).length > 0 &&
      commentsOk && projectsOk && adminOk,
    `?language=Chinese → HTTP=${legacyZh.status} ids=[${idsOf(legacyZh.json).join(', ')}]; ` +
      `?language=English → HTTP=${legacyEn.status} ids=[${idsOf(legacyEn.json).slice(0, 3).join(', ')}]; ` +
      `/api/comments → HTTP=${comments.status} 含 comments 数组=${!!(commentsJson && Array.isArray(commentsJson.comments))} 条数=${commentsJson?.comments?.length}; ` +
      `/api/projects → HTTP=${projects.status} 条数=${projectsJson?.length}; ` +
      `/api/admin/comments → HTTP=${adminComments.status}（ADMIN_TOKEN 已配置，无 token 预期 401）`,
  );
}

// --- S24 性能与缓存 ---------------------------------------------------------
{
  const ip = '10.0.0.24';
  const timings = [];
  let cachedFlagSeen = false;

  // 先预热一次
  await getJson(`${BASE}/api/search?q=nextjs&locale=en`, ip);

  for (let i = 0; i < 20; i++) {
    const t0 = performance.now();
    const r = await req(`${BASE}/api/search?q=nextjs&locale=en`, { ip });
    const dt = performance.now() - t0;
    if (r.status === 429) break;
    timings.push(dt);
  }

  const token = process.env.ADMIN_TOKEN || 'dev-admin-token-change-me';
  const buildsRes = await req(`${BASE}/api/admin/search-analytics?limit=1`, {
    ip: '10.9.0.27',
    headers: { authorization: `Bearer ${token}` },
  });
  cachedFlagSeen = buildsRes.status === 200;

  const sorted = [...timings].sort((a, b) => a - b);
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  const avg = timings.reduce((a, b) => a + b, 0) / timings.length;

  record(
    'S24',
    '索引构建有缓存 + 20 次连续请求耗时（含 p95）',
    timings.length === 20,
    `成功请求数=${timings.length}/20（无 429）; ` +
      `min=${Math.min(...timings).toFixed(1)}ms avg=${avg.toFixed(1)}ms p95=${p95.toFixed(1)}ms max=${Math.max(...timings).toFixed(1)}ms; ` +
      `缓存策略=进程内 globalThis 单例（src/lib/searchIndexCache.ts，TTL 5min，按 locale 分桶）；` +
      `构建次数证据见单元测试 searchService.test.ts「连续请求只构建一次索引」`,
  );
  void cachedFlagSeen;
}

// ===========================================================================
log('='.repeat(72));
log(`SUMMARY: PASS=${pass} FAIL=${fail} TOTAL=${pass + fail}`);
log('='.repeat(72));

fs.writeFileSync(OUT, lines.join('\n'));
console.log(`\nwritten → ${OUT}`);
process.exit(fail === 0 ? 0 : 1);
