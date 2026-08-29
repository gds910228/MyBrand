import { describe, it, expect, beforeEach } from 'vitest';
import {
  getLocalCommentsByPostId,
  addLocalComment,
  setLocalCommentStatus,
  getAllLocalCommentsForAdmin,
  resetLocalCommentsForTest,
} from '@/data/comments';
import type { NewCommentInput } from '@/types/comment';

// feat-comment-moderation: 本地兜底层（spec §1.3/§5.3b）
// 每用例后 reset 防模块状态泄漏。
beforeEach(() => {
  resetLocalCommentsForTest();
});

const newComment = (over: Partial<NewCommentInput> = {}): NewCommentInput => ({
  postId: 'post-test',
  parentId: null,
  author: { name: 'Tester', email: 'tester@example.com' },
  content: 'A perfectly normal and meaningful comment.',
  status: 'approved',
  ...over,
});

describe('种子数据（旧数据无状态字段）', () => {
  it('种子评论无 status 字段时兜底 approved 且可见', () => {
    const tree = getLocalCommentsByPostId('post-getting-started-with-nextjs-14');
    expect(tree.length).toBeGreaterThan(0);
    // comment-1 与 comment-3 为顶级
    expect(tree.map((c) => c.id).sort()).toEqual(['comment-1', 'comment-3']);
    // comment-2 是 comment-1 的回复，挂载可见
    expect(tree.find((c) => c.id === 'comment-1')?.replies?.map((r) => r.id)).toEqual(['comment-2']);
  });
});

describe('状态过滤（前台口径）', () => {
  it('pending/spam 顶级评论不出现', () => {
    addLocalComment(newComment({ content: 'ok comment text' }));
    addLocalComment(newComment({ content: 'pending comment text', status: 'pending' }));
    addLocalComment(newComment({ content: 'spam comment text', status: 'spam' }));
    const tree = getLocalCommentsByPostId('post-test');
    expect(tree).toHaveLength(1);
    expect(tree[0].status).toBe('approved');
  });

  it('pending/spam 回复不随树吐出', () => {
    const root = addLocalComment(newComment({ content: 'root comment text' }));
    addLocalComment(newComment({ parentId: root.id, content: 'good reply text' }));
    addLocalComment(newComment({ parentId: root.id, content: 'bad reply text', status: 'spam' }));
    addLocalComment(newComment({ parentId: root.id, content: 'wait reply text', status: 'pending' }));
    const tree = getLocalCommentsByPostId('post-test');
    expect(tree[0].replies?.map((r) => r.status)).toEqual(['approved']);
  });

  it('挂在 pending 父评论下的 approved 回复成孤儿不出现', () => {
    const hidden = addLocalComment(newComment({ content: 'hidden parent text', status: 'pending' }));
    addLocalComment(newComment({ parentId: hidden.id, content: 'orphan reply text' }));
    const tree = getLocalCommentsByPostId('post-test');
    expect(tree).toHaveLength(0);
  });
});

describe('setLocalCommentStatus 状态流转', () => {
  it('pending → approved 后前台立即可见（翻转可见性）', () => {
    const c = addLocalComment(newComment({ content: 'will be approved text', status: 'pending' }));
    expect(getLocalCommentsByPostId('post-test')).toHaveLength(0);
    expect(setLocalCommentStatus(c.id, 'approved')).toBe(true);
    const tree = getLocalCommentsByPostId('post-test');
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe(c.id);
  });

  it('approved → spam 后前台消失', () => {
    const c = addLocalComment(newComment({ content: 'will be spam text' }));
    expect(getLocalCommentsByPostId('post-test')).toHaveLength(1);
    expect(setLocalCommentStatus(c.id, 'spam')).toBe(true);
    expect(getLocalCommentsByPostId('post-test')).toHaveLength(0);
  });

  it('回复的状态流转同样生效', () => {
    const root = addLocalComment(newComment({ content: 'root for reply text' }));
    const reply = addLocalComment(newComment({ parentId: root.id, content: 'reply pending text', status: 'pending' }));
    expect(getLocalCommentsByPostId('post-test')[0].replies ?? []).toHaveLength(0);
    setLocalCommentStatus(reply.id, 'approved');
    expect(getLocalCommentsByPostId('post-test')[0].replies?.map((r) => r.id)).toEqual([reply.id]);
  });

  it('不存在的 id 返回 false', () => {
    expect(setLocalCommentStatus('nope', 'approved')).toBe(false);
  });
});

describe('前台公共树不泄露治理字段（P0-1 回归）', () => {
  it('approved 评论树的 JSON 不含 spamScore/spamReasons（Notion 路径同样走 filterApprovedTree）', () => {
    addLocalComment(
      newComment({
        content: 'approved but scored text',
        status: 'approved',
        spamScore: 20,
        spamReasons: ['too_short'],
      }),
    );
    addLocalComment(
      newComment({
        content: 'approved reply scored text',
        status: 'approved',
        spamScore: 0,
        spamReasons: [],
      }),
    );
    const tree = getLocalCommentsByPostId('post-test');
    const json = JSON.stringify(tree);
    expect(json).not.toContain('spamScore');
    expect(json).not.toContain('spamReasons');
    expect(json).not.toContain('too_short');
  });

  it('后台全量条目仍保留治理字段（工作台需要）', () => {
    addLocalComment(
      newComment({ content: 'admin sees scores text', status: 'pending', spamScore: 55, spamReasons: ['links:2'] }),
    );
    const admin = getAllLocalCommentsForAdmin({ status: 'pending' });
    expect(admin.items[0].spamScore).toBe(55);
    expect(admin.items[0].spamReasons).toEqual(['links:2']);
  });
});

describe('getAllLocalCommentsForAdmin（后台全量 + 计数）', () => {
  it('返回扁平三态条目与精确计数（计数含 3 条种子 approved）', () => {
    addLocalComment(newComment({ content: 'a approved text', status: 'approved', spamScore: 10, spamReasons: [] }));
    addLocalComment(newComment({ content: 'b pending text', status: 'pending', spamScore: 45, spamReasons: ['links:1'] }));
    addLocalComment(newComment({ content: 'c spam text', status: 'spam', spamScore: 80, spamReasons: ['links:3', 'keyword:casino'] }));
    const all = getAllLocalCommentsForAdmin({ status: 'all' });
    expect(all.counts).toEqual({ pending: 1, spam: 1, approved: 4, total: 6 });
    expect(all.capped).toBe(false);
    expect(all.items).toHaveLength(6);
    // 按 createdAt desc（新写入在前）
    expect(all.items[0].content).toBe('c spam text');
    // 条目含作者邮箱与治理字段
    const pending = all.items.find((i) => i.status === 'pending')!;
    expect(pending.author.email).toBe('tester@example.com');
    expect(pending.spamScore).toBe(45);
    expect(pending.spamReasons).toEqual(['links:1']);
  });

  it('按 status 过滤', () => {
    addLocalComment(newComment({ content: 'a text', status: 'approved' }));
    addLocalComment(newComment({ content: 'b text', status: 'pending' }));
    addLocalComment(newComment({ content: 'c text', status: 'pending' }));
    expect(getAllLocalCommentsForAdmin({ status: 'pending' }).items).toHaveLength(2);
    expect(getAllLocalCommentsForAdmin({ status: 'spam' }).items).toHaveLength(0);
  });

  it('limit clamp 到 1-100 且 capped 标记正确', () => {
    for (let i = 0; i < 5; i++) {
      addLocalComment(newComment({ content: `bulk text ${i}` }));
    }
    const l2 = getAllLocalCommentsForAdmin({ status: 'all', limit: 2 });
    expect(l2.items).toHaveLength(2);
    expect(l2.capped).toBe(true);
    const l0 = getAllLocalCommentsForAdmin({ status: 'all', limit: 0 });
    expect(l0.items).toHaveLength(1); // 0 → clamp 到 1
    const l200 = getAllLocalCommentsForAdmin({ status: 'all', limit: 200 });
    expect(l200.items).toHaveLength(8); // 3 种子 + 5 新增；>100 clamp 到 100 不影响
    expect(l200.capped).toBe(false);
    // 垃圾值 → 默认 50，不炸
    expect(getAllLocalCommentsForAdmin({ status: 'all', limit: NaN }).items).toHaveLength(8);
  });
});
