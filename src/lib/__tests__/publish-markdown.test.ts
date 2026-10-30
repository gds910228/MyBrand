/**
 * 发布管线 Markdown 层单测:parseMarkdown + markdownToNotion(feat-publish-pipeline)。
 */
import { describe, it, expect } from 'vitest';
import { parseMarkdown, normalizeFrontmatter, estimateReadingMinutes } from '@/lib/publish/parseMarkdown';
import {
  markdownToNotionBlocks,
  chunkBlocks,
  mapCodeLanguage,
} from '@/lib/publish/markdownToNotion';

function convert(raw: string) {
  const doc = parseMarkdown(raw);
  return { doc, ...markdownToNotionBlocks(doc.ast) };
}

describe('parseMarkdown', () => {
  it('解析 frontmatter 与正文', () => {
    const doc = parseMarkdown('---\ntitle: 测试\nslug: test-post\ntags: A, B\n---\n\n# 正文');
    expect(doc.frontmatter.title).toBe('测试');
    expect(doc.body).toContain('# 正文');
    expect(doc.coverRef).toBeNull();
  });

  it('Obsidian wiki 嵌入转为标准图片引用', () => {
    const doc = parseMarkdown('![[截图 2026.png]] 前文 ![[pic.jpg|说明文字]]');
    expect(doc.images).toHaveLength(2);
    expect(doc.images[0]).toMatchObject({ ref: '截图 2026.png', external: false });
    expect(doc.images[1]).toMatchObject({ ref: 'pic.jpg', alt: '说明文字' });
  });

  it('标准图片与外链图片均被收集,mmbiz 防盗链被标记', () => {
    const doc = parseMarkdown(
      '![](local/a.png) ![unsplash](https://images.unsplash.com/x.jpg) ![wx](https://mmbiz.qpic.cn/abc)',
    );
    expect(doc.images).toHaveLength(3);
    expect(doc.images[0].external).toBe(false);
    expect(doc.images[1].external).toBe(true);
    expect(doc.images[2].hotlinkProtected).toBe(true);
  });

  it('cover 字段提取', () => {
    const doc = parseMarkdown('---\ncover: assets/cover.png\n---\n正文');
    expect(doc.coverRef).toBe('assets/cover.png');
  });

  it('原始 HTML 产生警告', () => {
    const doc = parseMarkdown('<div style="color:red">x</div>');
    expect(doc.warnings.some((w) => w.includes('HTML'))).toBe(true);
  });
});

describe('normalizeFrontmatter', () => {
  it('slug 规范化:小写、空格转连字符、剔除非法字符', () => {
    const fm = normalizeFrontmatter({ slug: 'My Post 01!' });
    expect(fm.slug).toBe('my-post-01');
  });

  it('语言归一化:en→English,默认中文', () => {
    expect(normalizeFrontmatter({ language: 'en' }).language).toBe('English');
    expect(normalizeFrontmatter({}).language).toBe('Chinese');
    expect(normalizeFrontmatter({ language: '中文' }).language).toBe('Chinese');
  });

  it('status 非法值回落 draft,publishDate 解析失败用今天', () => {
    const fm = normalizeFrontmatter({ status: 'bogus', publishDate: 'not-a-date' });
    expect(fm.status).toBe('draft');
    expect(fm.publishDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('tags 兼容字符串与数组;pros 兼容换行序号文本', () => {
    const fm = normalizeFrontmatter({ tags: 'AI图像生成、Midjourney', pros: '1. 优点一\n2. 优点二' });
    expect(fm.tags).toEqual(['AI图像生成', 'Midjourney']);
    expect(fm.pros).toEqual(['优点一', '优点二']);
  });
});

describe('estimateReadingMinutes', () => {
  it('中文按字数、英文按词数,最少 1 分钟', () => {
    expect(estimateReadingMinutes('短文')).toBe(1);
    expect(estimateReadingMinutes('字'.repeat(3500))).toBe(10);
  });
});

describe('markdownToNotionBlocks', () => {
  it('标题映射 + 四级标题降级警告', () => {
    const { blocks, warnings } = convert('# H1\n\n## H2\n\n#### H4');
    expect(blocks.map((b) => b.type)).toEqual(['heading_1', 'heading_2', 'heading_3']);
    expect(warnings.some((w) => w.includes('降级'))).toBe(true);
  });

  it('段落行内样式:粗体/斜体/行内代码/链接', () => {
    const { blocks } = convert('**粗体** 和 *斜体* 与 `code` 以及 [链接](https://a.com)');
    const rich = blocks[0].paragraph.rich_text;
    expect(rich[0].annotations.bold).toBe(true);
    expect(rich.some((t: any) => t.annotations.italic)).toBe(true);
    expect(rich.some((t: any) => t.annotations.code && t.text.content === 'code')).toBe(true);
    const link = rich.find((t: any) => t.text.link);
    expect(link.text.link.url).toBe('https://a.com');
  });

  it('嵌套列表拍平为同级块', () => {
    const { blocks } = convert('- a\n  - b\n    - c\n- d');
    const types = blocks.map((b) => b.type);
    expect(types).toEqual(['bulleted_list_item', 'bulleted_list_item', 'bulleted_list_item', 'bulleted_list_item']);
    expect(blocks.map((b) => b.bulleted_list_item.rich_text[0].text.content)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('有序列表 → numbered_list_item', () => {
    const { blocks } = convert('1. one\n2. two');
    expect(blocks.every((b) => b.type === 'numbered_list_item')).toBe(true);
  });

  it('代码块语言映射为 Notion 全小写枚举,未知语言降级 plain text', () => {
    expect(mapCodeLanguage('js')).toBe('javascript');
    expect(mapCodeLanguage('python')).toBe('python');
    expect(mapCodeLanguage('bash')).toBe('bash');
    expect(mapCodeLanguage('sh')).toBe('shell');
    expect(mapCodeLanguage('zsh')).toBe('shell');
    expect(mapCodeLanguage('c++')).toBe('c++');
    expect(mapCodeLanguage('brainfuck')).toBe('plain text');
    const { blocks } = convert('```ts\nconst a = 1;\n```');
    expect(blocks[0].type).toBe('code');
    expect(blocks[0].code.language).toBe('typescript');
  });

  it('普通引用 → quote', () => {
    const { blocks } = convert('> 引用一句话');
    expect(blocks[0].type).toBe('quote');
  });

  it('Obsidian callout → Notion callout(类型映射 emoji,标题加粗,多行合并)', () => {
    const { blocks } = convert('> [!warning] 注意事项\n> 第一行内容\n>\n> 第二段');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('callout');
    expect(blocks[0].callout.icon.emoji).toBe('⚠️');
    const texts = blocks[0].callout.rich_text.map((t: any) => t.text.content).join('');
    expect(texts).toContain('注意事项');
    expect(texts).toContain('第一行内容');
    expect(texts).toContain('第二段');
    expect(blocks[0].callout.rich_text[0].annotations.bold).toBe(true);
  });

  it('独立图片段落 → image 块(external + caption)', () => {
    const { blocks } = convert('![封面说明](https://cdn.jsdelivr.net/gh/a/b@main/x.png)');
    expect(blocks[0].type).toBe('image');
    expect(blocks[0].image.external.url).toContain('x.png');
    expect(blocks[0].image.caption[0].text.content).toBe('封面说明');
  });

  it('行内图片从段落中拆出,保持文档顺序', () => {
    const { blocks } = convert('前文 ![img](https://a.com/i.png) 后文');
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'image', 'paragraph']);
  });

  it('YouTube 裸链接段落 → video 块', () => {
    const { blocks } = convert('[https://www.youtube.com/watch?v=abc123](https://www.youtube.com/watch?v=abc123)');
    expect(blocks[0].type).toBe('video');
    expect(blocks[0].video.external.url).toContain('youtube.com');
  });

  it('GFM 表格 → table 块 + table_row 子块', () => {
    const { blocks } = convert('| A | B |\n| --- | --- |\n| 1 | 2 |');
    expect(blocks[0].type).toBe('table');
    expect(blocks[0].table.table_width).toBe(2);
    expect(blocks[0].table.has_column_header).toBe(true);
    expect(blocks[0].table.children).toHaveLength(2);
    expect(blocks[0].table.children[1].table_row.cells[0][0].text.content).toBe('1');
  });

  it('分隔线 → divider', () => {
    const { blocks } = convert('上文\n\n---\n\n下文');
    expect(blocks.some((b) => b.type === 'divider')).toBe(true);
  });

  it('超长文本按 1900 字符切分为多条 rich_text', () => {
    const { blocks } = convert('长'.repeat(4000));
    const rich = blocks[0].paragraph.rich_text;
    expect(rich.length).toBe(3);
    expect(rich.every((t: any) => t.text.content.length <= 1900)).toBe(true);
  });
});

describe('chunkBlocks', () => {
  it('不超过首批判直接返回单块', () => {
    const blocks = Array.from({ length: 95 }, (_, i) => ({ object: 'block' as const, type: 'divider', divider: {} }));
    expect(chunkBlocks(blocks)).toHaveLength(1);
  });

  it('超限分批且每批 ≤95', () => {
    const blocks = Array.from({ length: 200 }, (_, i) => ({ object: 'block' as const, type: 'divider', divider: {} }));
    const chunks = chunkBlocks(blocks);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(95);
    expect(chunks.flat()).toHaveLength(200);
  });
});
