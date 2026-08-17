import { describe, it, expect } from 'vitest';
import { selectDueScheduledPosts, runScheduledPublish } from '../scheduledPublish';

// b) cron 发布:scheduled+scheduledAt<=now 转 published,未来时间不转,单篇失败隔离
const NOW = new Date('2026-08-11T12:00:00.000Z');

const post = (id: string, status: string | null, scheduledAt: string | null) => ({
  id,
  slug: `slug-${id}`,
  status,
  scheduledAt,
});

describe('selectDueScheduledPosts', () => {
  it('scheduled 且 scheduledAt<=now → due;未来时间 → skipped', () => {
    const posts = [
      post('due-1', 'Scheduled', '2026-08-11T11:00:00.000Z'),
      post('due-now', 'Scheduled', '2026-08-11T12:00:00.000Z'), // 恰等于 now → 到期
      post('future', 'Scheduled', '2026-08-12T12:00:00.000Z'),
      post('published', 'Published', '2026-08-01T00:00:00.000Z'), // 非 scheduled 不进结果
      post('draft', 'Draft', null),
    ];
    const { due, skipped } = selectDueScheduledPosts(posts, NOW);
    expect(due.map((p) => p.id)).toEqual(['due-1', 'due-now']);
    expect(skipped.map((p) => p.id)).toEqual(['future']);
  });

  it('scheduled 但 scheduledAt 缺失/非法 → skipped(不静默发布)', () => {
    const posts = [
      post('no-date', 'Scheduled', null),
      post('bad-date', 'Scheduled', 'not-a-date'),
      post('empty-date', 'Scheduled', ''),
    ];
    const { due, skipped } = selectDueScheduledPosts(posts, NOW);
    expect(due).toEqual([]);
    expect(skipped.map((p) => p.id)).toEqual(['no-date', 'bad-date', 'empty-date']);
  });

  it('status 大小写不敏感;无 status 视为 published 不进扫描', () => {
    const posts = [post('lower', 'scheduled', '2026-08-11T11:00:00.000Z'), post('legacy', null, null)];
    const { due, skipped } = selectDueScheduledPosts(posts, NOW);
    expect(due.map((p) => p.id)).toEqual(['lower']);
    expect(skipped).toEqual([]);
  });
});

describe('runScheduledPublish', () => {
  it('到期文章逐篇 publish,返回 processed 计数', async () => {
    const published: string[] = [];
    const result = await runScheduledPublish({
      posts: [
        post('a', 'Scheduled', '2026-08-11T10:00:00.000Z'),
        post('b', 'Scheduled', '2026-08-11T11:00:00.000Z'),
      ],
      now: NOW,
      publish: async (p) => {
        published.push(p.id);
      },
    });
    expect(published).toEqual(['a', 'b']);
    expect(result.processed).toEqual(['a', 'b']);
    expect(result.failed).toEqual([]);
    expect(result.skipped).toEqual([]);
  });

  it('未来时间不发布(计入 skipped)', async () => {
    const published: string[] = [];
    const result = await runScheduledPublish({
      posts: [post('future', 'Scheduled', '2027-01-01T00:00:00.000Z')],
      now: NOW,
      publish: async (p) => {
        published.push(p.id);
      },
    });
    expect(published).toEqual([]);
    expect(result.processed).toEqual([]);
    expect(result.skipped).toEqual(['future']);
  });

  it('单篇失败隔离:失败计入 failed,不影响后续文章', async () => {
    const published: string[] = [];
    const result = await runScheduledPublish({
      posts: [
        post('ok-1', 'Scheduled', '2026-08-11T10:00:00.000Z'),
        post('boom', 'Scheduled', '2026-08-11T10:30:00.000Z'),
        post('ok-2', 'Scheduled', '2026-08-11T11:00:00.000Z'),
      ],
      now: NOW,
      publish: async (p) => {
        if (p.id === 'boom') throw new Error('notion write failed');
        published.push(p.id);
      },
    });
    expect(published).toEqual(['ok-1', 'ok-2']);
    expect(result.processed).toEqual(['ok-1', 'ok-2']);
    expect(result.failed).toEqual([{ id: 'boom', error: 'notion write failed' }]);
    expect(result.skipped).toEqual([]);
  });

  it('非 Error 抛值也被隔离并字符串化', async () => {
    const result = await runScheduledPublish({
      posts: [post('weird', 'Scheduled', '2026-08-11T10:00:00.000Z')],
      now: NOW,
      publish: async () => {
        // eslint-disable-next-line no-throw-literal
        throw 'string failure';
      },
    });
    expect(result.failed).toEqual([{ id: 'weird', error: 'string failure' }]);
  });
});
