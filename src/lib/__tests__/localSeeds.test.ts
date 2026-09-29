/**
 * 本地种子数据完整性测试（T18）。
 *
 * 守住三件事：
 * 1. 需求要求的种子规模与双语字段齐全（projects ≥6、双语 + technologies）；
 * 2. 适配层展平后的形状可被既有消费方直接使用（评审 spec_review_v1 D-2）；
 * 3. **基准集 fixture 引用的文档 id 在种子中确实存在**——否则基准集是空转的。
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { blogPosts } from '@/data/blog';
import { projects } from '@/data/projects';
import {
  getLocalBlogPostById,
  getLocalBlogPosts,
  getLocalProjectById,
  getLocalProjectBySlug,
  getLocalProjects,
  htmlToNotionBlocks,
  normalizeLanguage,
} from '@/data/localContent';
import { getSearchDocuments } from '@/services/searchData';

const FIXTURE = path.resolve(__dirname, 'fixtures/searchBenchmark.json');

describe('本地种子 / 规模与字段完整性', () => {
  it('项目种子 ≥6 且双语文案齐全', () => {
    expect(projects.length).toBeGreaterThanOrEqual(6);
    for (const p of projects) {
      expect(p.id, p.slug).toBeTruthy();
      expect(p.slug, p.id).toBeTruthy();
      for (const field of ['title', 'subtitle', 'description', 'role'] as const) {
        expect(p[field].en.trim(), `${p.id}.${field}.en`).toBeTruthy();
        expect(p[field].zh.trim(), `${p.id}.${field}.zh`).toBeTruthy();
      }
      expect(p.technologies.length, `${p.id}.technologies`).toBeGreaterThan(0);
      expect(p.publishedAt, `${p.id}.publishedAt`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('博客种子 ≥6 且双语标题/摘要齐全', () => {
    expect(blogPosts.length).toBeGreaterThanOrEqual(6);
    for (const p of blogPosts) {
      expect(p.title.en.trim(), `${p.id}.title.en`).toBeTruthy();
      expect(p.title.zh.trim(), `${p.id}.title.zh`).toBeTruthy();
      expect(p.excerpt.en.trim(), `${p.id}.excerpt.en`).toBeTruthy();
      expect(p.excerpt.zh.trim(), `${p.id}.excerpt.zh`).toBeTruthy();
      expect(p.publishedAt, `${p.id}.publishedAt`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('id 与 slug 全局唯一', () => {
    const ids = [...blogPosts.map((p) => p.id), ...projects.map((p) => p.id)];
    expect(new Set(ids).size).toBe(ids.length);

    const slugs = [...blogPosts.map((p) => p.slug), ...projects.map((p) => p.slug)];
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('既有 10 篇博客种子未被删除（Rules：不删除 src/data fallback 数据）', () => {
    const legacy = ['post-1', 'post-2', 'post-3', 'post-4', 'post-5', 'post-6', 'post-7', 'post-8', 'post-9', 'post-test-image-video'];
    const ids = new Set(blogPosts.map((p) => p.id));
    for (const id of legacy) expect(ids.has(id), id).toBe(true);
  });

  it('基准集引用的所有文档 id 都存在于种子中', () => {
    const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8')) as {
      queries: Array<{ id: string; expectAnyOf: string[]; expectNoneOf: string[] }>;
    };
    const known = new Set([
      ...blogPosts.map((p) => `blog:${p.id}`),
      ...projects.map((p) => `project:${p.id}`),
    ]);

    for (const q of fixture.queries) {
      for (const id of [...q.expectAnyOf, ...q.expectNoneOf]) {
        expect(known.has(id), `${q.id} 引用了不存在的文档 ${id}`).toBe(true);
      }
    }
  });
});

describe('本地适配层 / 形状与语言展平', () => {
  it('normalizeLanguage 非 Chinese 一律英文', () => {
    expect(normalizeLanguage('Chinese')).toBe('Chinese');
    expect(normalizeLanguage('English')).toBe('English');
    expect(normalizeLanguage(undefined)).toBe('English');
    expect(normalizeLanguage('fr')).toBe('English');
  });

  it('项目列表项字段全部为标量（评审 D-2：不得透传 {en,zh} 对象）', () => {
    const [p] = getLocalProjects('English');
    for (const field of ['title', 'subtitle', 'description', 'role', 'client', 'year', 'slug'] as const) {
      expect(typeof p[field], field).toBe('string');
    }
    expect(Array.isArray(p.technologies)).toBe(true);
    expect(typeof p.featured).toBe('boolean');
  });

  it('项目按语言展平出不同文案', () => {
    const en = getLocalProjects('English').find((p) => p.id === 'proj-1')!;
    const zh = getLocalProjects('Chinese').find((p) => p.id === 'proj-1')!;
    expect(en.title).not.toBe(zh.title);
    expect(en.title).toContain('MisoTech');
    expect(zh.title).toContain('MisoTech');
  });

  it('项目列表项带 date 与 createdTime（searchData 依赖，D-2）', () => {
    const [p] = getLocalProjects('English');
    expect(Number.isFinite(new Date(p.date).getTime())).toBe(true);
    expect(Number.isFinite(new Date(p.createdTime).getTime())).toBe(true);
  });

  it('语言字段取值与 searchData 的过滤器一致（English/Chinese）', () => {
    for (const p of getLocalProjects('Chinese')) expect(p.language).toBe('Chinese');
    for (const p of getLocalBlogPosts('Chinese')) expect(p.language).toBe('Chinese');
    for (const p of getLocalProjects('English')) expect(p.language).toBe('English');
  });

  it('博客列表项 tags 回落 categories（既有种子无 tags 字段）', () => {
    const post = getLocalBlogPosts('English').find((p) => p.id === 'post-1')!;
    expect(post.tags.length).toBeGreaterThan(0);
    expect(post.tags).toContain('webdev');
  });

  it('博客列表项带可用 readTime', () => {
    for (const p of getLocalBlogPosts('English')) {
      expect(typeof p.readTime).toBe('string');
      expect(p.readTime.length).toBeGreaterThan(0);
    }
  });

  it('按 id 取详情返回 Notion 形状的 content blocks', () => {
    const post = getLocalBlogPostById('post-10', 'English')!;
    expect(post).not.toBeNull();
    expect(Array.isArray(post.content)).toBe(true);
    expect(post.content.length).toBeGreaterThan(0);
    for (const block of post.content) {
      expect(typeof block.type).toBe('string');
      expect(block[block.type]).toBeDefined();
      expect(Array.isArray(block[block.type].rich_text)).toBe(true);
    }
  });

  it('博客详情按语言返回对应正文', () => {
    const en = getLocalBlogPostById('post-10', 'English')!;
    const zh = getLocalBlogPostById('post-10', 'Chinese')!;
    expect(en.title).not.toBe(zh.title);
    expect(JSON.stringify(en.content)).not.toBe(JSON.stringify(zh.content));
  });

  it('未知 id 返回 null（不抛错）', () => {
    expect(getLocalBlogPostById('nope')).toBeNull();
    expect(getLocalProjectById('nope')).toBeNull();
    expect(getLocalProjectBySlug('nope')).toBeNull();
  });

  it('按 slug 取项目', () => {
    const p = getLocalProjectBySlug('ecommerce-microservices', 'English')!;
    expect(p).not.toBeNull();
    expect(p.id).toBe('proj-3');
    expect(p.technologies).toContain('Docker');
  });

  it('项目详情含 content blocks 与 responsibilities', () => {
    const p = getLocalProjectById('proj-1', 'English')!;
    expect(Array.isArray(p.content)).toBe(true);
    expect(p.content.length).toBeGreaterThan(0);
    expect(Array.isArray(p.responsibilities)).toBe(true);
  });
});

describe('htmlToNotionBlocks', () => {
  it('转换 h2/h3/p/ul/blockquote', () => {
    const blocks = htmlToNotionBlocks(
      '<h2>标题</h2><h3>小标题</h3><p>段落</p><ul><li>甲</li><li>乙</li></ul><blockquote>引用</blockquote>',
    );
    expect(blocks.map((b) => b.type)).toEqual([
      'heading_2',
      'heading_3',
      'paragraph',
      'bulleted_list_item',
      'bulleted_list_item',
      'quote',
    ]);
    expect(blocks[0].heading_2.rich_text[0].plain_text).toBe('标题');
  });

  it('剥离内联标签与实体', () => {
    const blocks = htmlToNotionBlocks('<p>a <code>b</code> &amp; c</p>');
    expect(blocks[0].paragraph.rich_text[0].plain_text).toBe('a b & c');
  });

  it('空输入返回空数组', () => {
    expect(htmlToNotionBlocks('')).toEqual([]);
    expect(htmlToNotionBlocks(undefined)).toEqual([]);
  });
});

describe('getSearchDocuments 适配层', () => {
  it('产出两类文档且每篇带 language 标签', async () => {
    const docs = await getSearchDocuments('en');
    expect(docs.length).toBe(blogPosts.length + projects.length);
    for (const d of docs) {
      expect(d.language).toBe('English');
      expect(d.id).toMatch(/^(blog|project):/);
      expect(d.title.trim()).toBeTruthy();
    }
  });

  it('中英文档集标题确实不同（语言过滤生效）', async () => {
    const en = await getSearchDocuments('en');
    const zh = await getSearchDocuments('zh');
    const enTitles = new Set(en.map((d) => d.title));
    const zhTitles = new Set(zh.map((d) => d.title));
    const overlap = Array.from(zhTitles).filter((t) => enTitles.has(t));
    // 允许极少数中英同名（如纯技术名词），但绝大多数应不同
    expect(overlap.length).toBeLessThan(zhTitles.size / 2);
  });

  it('项目文档的 keywords 来自 technologies', async () => {
    const docs = await getSearchDocuments('en');
    const proj = docs.find((d) => d.id === 'project:proj-3')!;
    expect(proj.keywords).toContain('Docker');
  });
});
