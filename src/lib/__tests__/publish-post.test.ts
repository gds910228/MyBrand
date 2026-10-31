/**
 * 发布管线发布层单测:属性组装/图片匹配/URL 回写/AI 输出校验/图床配置(feat-publish-pipeline)。
 */
import { describe, it, expect } from 'vitest';
import { buildPostProperties, matchImageBuffer, rewriteImageUrls, PublishError } from '@/lib/publish/publishPost';
import { extractJson, validateAiTrio } from '@/lib/publish/aiFields';
import { sanitizeFileName, resolveImageHostConfig, ImageHostError } from '@/lib/publish/imageHost';
import { parseMarkdown, normalizeFrontmatter } from '@/lib/publish/parseMarkdown';

const FULL_SCHEMA = {
  Title: { type: 'title' },
  Slug: { type: 'rich_text' },
  Language: { type: 'select' },
  Status: { type: 'select' },
  PublishDate: { type: 'date' },
  scheduledAt: { type: 'date' },
  Summary: { type: 'rich_text' },
  Tags: { type: 'multi_select' },
  CoverImageUrl: { type: 'url' },
  Rating_Overall: { type: 'number' },
  Rating_EaseOfUse: { type: 'number' },
  Rating_Features: { type: 'number' },
  Pros: { type: 'rich_text' },
  Cons: { type: 'rich_text' },
  Tool_Website: { type: 'url' },
  Tool_Pricing: { type: 'rich_text' },
  ComparisonColumns: { type: 'rich_text' },
  ComparisonData: { type: 'rich_text' },
  ReadingTime: { type: 'number' },
};

const BASE_FM = normalizeFrontmatter({ title: '测试帖', slug: 'test-post' });

describe('buildPostProperties', () => {
  it('全字段 schema:基础属性按类型正确组装', () => {
    const props = buildPostProperties({
      fm: { ...BASE_FM, status: 'draft', publishDate: '2026-10-26', tags: ['AI', '评测'] },
      ai: null,
      coverUrl: null,
      readingTime: 5,
      schema: FULL_SCHEMA,
    });
    expect(props.Title.title[0].text.content).toBe('测试帖');
    expect(props.Slug.rich_text[0].text.content).toBe('test-post');
    expect(props.Language).toEqual({ select: { name: 'Chinese' } });
    expect(props.Status).toEqual({ select: { name: 'Draft' } });
    expect(props.PublishDate).toEqual({ date: { start: '2026-10-26' } });
    expect(props.Tags.multi_select.map((t: any) => t.name)).toEqual(['AI', '评测']);
    expect(props.ReadingTime).toEqual({ number: 5 });
  });

  it('Summary 缺失时回退 Excerpt;slug 属性名兼容小写 slug', () => {
    const props = buildPostProperties({
      fm: { ...BASE_FM, summary: '摘要内容' },
      ai: null,
      coverUrl: null,
      readingTime: 1,
      schema: { Title: { type: 'title' }, slug: { type: 'rich_text' }, Excerpt: { type: 'rich_text' } },
    });
    expect(props.slug.rich_text[0].text.content).toBe('test-post');
    expect(props.Excerpt.rich_text[0].text.content).toBe('摘要内容');
    expect(props.Summary).toBeUndefined();
  });

  it('封面属性按数据库真实类型写入(url/rich_text/files)', () => {
    const args = { fm: BASE_FM, ai: null, coverUrl: 'https://cdn.jsdelivr.net/gh/a/b@main/images/x.png', readingTime: 1 };
    expect(buildPostProperties({ ...args, schema: { Title: { type: 'title' }, CoverImageUrl: { type: 'url' } } }).CoverImageUrl)
      .toEqual({ url: args.coverUrl });
    expect(buildPostProperties({ ...args, schema: { Title: { type: 'title' }, CoverImage: { type: 'rich_text' } } }).CoverImage)
      .toEqual({ rich_text: [{ type: 'text', text: { content: args.coverUrl } }] });
    expect(
      buildPostProperties({ ...args, schema: { Title: { type: 'title' }, CoverImage: { type: 'files' } } }).CoverImage.files[0],
    ).toMatchObject({ type: 'external', external: { url: args.coverUrl } });
  });

  it('AI 字段参与合并且 frontmatter 优先;0 分视为未评分', () => {
    const props = buildPostProperties({
      fm: { ...BASE_FM, ratingOverall: 4.9 },
      ai: {
        Rating_Overall: 3.0,
        Rating_EaseOfUse: 0,
        Rating_Features: 4.0,
        Pros: ['AI 优点'],
        Tool_Website: 'https://tool.example.com',
        Tool_Pricing: '$10/月',
        Summary: 'AI 摘要',
        ComparisonColumns: [{ key: 'price' }],
        ComparisonData: [{ id: 't1' }],
      },
      coverUrl: null,
      readingTime: 1,
      schema: FULL_SCHEMA,
    });
    expect(props.Rating_Overall).toEqual({ number: 4.9 });
    expect(props.Rating_Features).toEqual({ number: 4.0 });
    expect(props.Rating_EaseOfUse).toBeUndefined();
    expect(props.Pros.rich_text[0].text.content).toBe('1. AI 优点');
    expect(props.Tool_Website).toEqual({ url: 'https://tool.example.com' });
    expect(JSON.parse(props.ComparisonColumns.rich_text[0].text.content)).toEqual([{ key: 'price' }]);
    expect(JSON.parse(props.ComparisonData.rich_text[0].text.content)).toEqual([{ id: 't1' }]);
  });

  it('对比表来自 frontmatter/表单覆盖,兼容下划线属性名', () => {
    const fm = normalizeFrontmatter({
      title: 't',
      slug: 's',
      comparisonColumns: [{ key: 'price' }],
      comparisonData: [{ id: 't1' }],
    });
    const props = buildPostProperties({
      fm,
      ai: null,
      coverUrl: null,
      readingTime: 1,
      schema: {
        Title: { type: 'title' },
        Comparison_Columns: { type: 'rich_text' },
        Comparison_Data: { type: 'rich_text' },
      },
    });
    expect(JSON.parse(props.Comparison_Columns.rich_text[0].text.content)).toEqual([{ key: 'price' }]);
    expect(JSON.parse(props.Comparison_Data.rich_text[0].text.content)).toEqual([{ id: 't1' }]);
  });

  it('scheduled 状态写入 scheduledAt;缺 title/slug 抛 PublishError', () => {
    const props = buildPostProperties({
      fm: { ...BASE_FM, status: 'scheduled', scheduledAtRaw: '2026-11-01T09:00:00+08:00' },
      ai: null,
      coverUrl: null,
      readingTime: 1,
      schema: FULL_SCHEMA,
    });
    expect(props.Status).toEqual({ select: { name: 'Scheduled' } });
    expect(props.scheduledAt).toEqual({ date: { start: '2026-11-01T09:00:00+08:00' } });

    expect(() =>
      buildPostProperties({ fm: normalizeFrontmatter({}), ai: null, coverUrl: null, readingTime: 1, schema: FULL_SCHEMA }),
    ).toThrow(PublishError);
    expect(() =>
      buildPostProperties({
        fm: normalizeFrontmatter({ title: '无slug' }),
        ai: null,
        coverUrl: null,
        readingTime: 1,
        schema: FULL_SCHEMA,
      }),
    ).toThrow(PublishError);
  });
});

describe('buildPostProperties 站长默认字段', () => {
  it('AuthorText 默认 Archer;ButtonAllUpdate 按 url 类型写入', () => {
    const schema = { Title: { type: 'title' }, AuthorText: { type: 'rich_text' }, ButtonAllUpdate: { type: 'url' } };
    const props = buildPostProperties({
      fm: BASE_FM,
      ai: null,
      coverUrl: null,
      readingTime: 1,
      schema,
      authorName: 'Archer',
      buttonUrl: 'https://misitebo.win/api/revalidate?secret=x',
    });
    expect(props.AuthorText).toEqual({ rich_text: [{ type: 'text', text: { content: 'Archer' } }] });
    expect(props.ButtonAllUpdate).toEqual({ url: 'https://misitebo.win/api/revalidate?secret=x' });
  });

  it('库中无对应属性时不写;buttonUrl 缺省不写', () => {
    const props = buildPostProperties({
      fm: BASE_FM,
      ai: null,
      coverUrl: null,
      readingTime: 1,
      schema: { Title: { type: 'title' } },
    });
    expect(props.AuthorText).toBeUndefined();
    expect(props.ButtonAllUpdate).toBeUndefined();
  });
});

describe('matchImageBuffer', () => {
  const files = new Map<string, Buffer>([
    ['/vault/assets/pic.png', Buffer.from('a')],
    ['cover.jpg', Buffer.from('b')],
  ]);

  it('精确 ref / 相对 ref / 文件名 / 无扩展名 stem 均可匹配', () => {
    expect(matchImageBuffer('/vault/assets/pic.png', files)?.toString()).toBe('a');
    expect(matchImageBuffer('./assets/pic.png', files)?.toString()).toBe('a');
    expect(matchImageBuffer('cover.jpg', files)?.toString()).toBe('b');
    expect(matchImageBuffer('pic', files)?.toString()).toBe('a');
    expect(matchImageBuffer('不存在.png', files)).toBeNull();
  });

  it('配图占位 ref 与上传文件按 stem 匹配', () => {
    const files2 = new Map([['配图1.png', Buffer.from('c')]]);
    expect(matchImageBuffer('配图1', files2)?.toString()).toBe('c');
  });
});

describe('rewriteImageUrls', () => {
  it('本地 ref 回写上传 URL;外链保留;mmbiz 与缺失文件被移除', () => {
    const doc = parseMarkdown(
      '![](a.png) ![keep](https://images.unsplash.com/x.jpg) ![wx](https://mmbiz.qpic.cn/y.jpg) ![gone](missing.png)',
    );
    const outcome = rewriteImageUrls(doc.ast, new Map([['a.png', 'https://cdn.jsdelivr.net/gh/r@main/images/a.png']]));
    expect(outcome.resolved).toBe(1);
    expect(outcome.externalKept).toBe(1);
    expect(outcome.dropped).toHaveLength(2);
    const urls = doc.ast.children[0].children
      .filter((n: any) => n.type === 'image')
      .map((n: any) => n.url);
    expect(urls[0]).toBe('https://cdn.jsdelivr.net/gh/r@main/images/a.png');
    expect(urls[1]).toContain('unsplash');
    expect(urls[2]).toBe('');
    expect(urls[3]).toBe('');
  });
});

describe('extractJson', () => {
  it('兼容代码围栏与前后噪声文本', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('好的,以下是结果:\n{"a":1}\n请查收')).toEqual({ a: 1 });
    expect(() => extractJson('完全没有 JSON')).toThrow();
  });
});

describe('validateAiTrio', () => {
  it('完整输出通过并规范化类型', () => {
    const { ok, normalized } = validateAiTrio({
      fields: {
        Title: ' 标题 ',
        Language: 'English',
        Summary: '摘要',
        Tags: ['A', 'B'],
        Slug: 'My Slug!',
        Rating_Overall: '4.5',
        Pros: ['x'],
      },
      coverPrompts: ['p1', 'p2', 'p3', 'p4'],
      tweet: '推文',
    });
    expect(ok).toBe(true);
    expect(normalized.fields.Title).toBe('标题');
    expect(normalized.fields.Language).toBe('English');
    expect(normalized.fields.Slug).toBe('my-slug');
    expect(normalized.fields.Rating_Overall).toBe(4.5);
    expect(normalized.coverPrompts).toHaveLength(3);
  });

  it('缺 fields 或 Title/Summary 全缺 → 校验失败;0 分视为省略', () => {
    expect(validateAiTrio(null).ok).toBe(false);
    expect(validateAiTrio({ tweet: 'x' }).ok).toBe(false);
    expect(validateAiTrio({ fields: { Tags: ['a'] } }).ok).toBe(false);
    // GLM 对非评测文输出 0 分占位 → 归一化后应为 undefined(表单不显示 0)
    const { normalized } = validateAiTrio({
      fields: { Title: 't', Summary: 's', Rating_Overall: 0, Rating_EaseOfUse: '0', Rating_Features: 4.2 },
      tweet: '',
    });
    expect(normalized.fields.Rating_Overall).toBeUndefined();
    expect(normalized.fields.Rating_EaseOfUse).toBeUndefined();
    expect(normalized.fields.Rating_Features).toBe(4.2);
  });
});

describe('imageHost 配置与文件名', () => {
  it('sanitizeFileName:中文转连字符,保留 ASCII 与扩展名', () => {
    expect(sanitizeFileName('我的 截图 01.png')).toBe('01.png');
  });

  it('sanitizeFileName:纯中文文件名回退 img', () => {
    const name = sanitizeFileName('图片');
    expect(name).toBe('img.png');
  });

  it('resolveImageHostConfig:缺 token/repo 报错;默认值正确', () => {
    expect(() => resolveImageHostConfig({})).toThrow(ImageHostError);
    expect(() => resolveImageHostConfig({ GITHUB_TOKEN: 't' })).toThrow(ImageHostError);
    const config = resolveImageHostConfig({ GITHUB_TOKEN: 't', IMAGE_REPO: 'a/b' });
    expect(config).toMatchObject({
      repo: 'a/b',
      branch: 'main',
      cdnBase: 'https://cdn.jsdelivr.net/gh/a/b@main',
      pathPrefix: 'images',
    });
  });
});
