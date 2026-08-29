import { describe, it, expect } from 'vitest';
import {
  normalizeCommentStatus,
  buildCommentTree,
  filterApprovedTree,
} from '../commentTree';
import type { CommentType } from '@/types/comment';

// feat-comment-moderation: 评论树纯函数（spec §1.3/§5.3b）
const c = (over: Partial<CommentType>): CommentType => ({
  id: 'x',
  postId: 'p1',
  parentId: null,
  author: { name: 'n', email: 'e@example.com' },
  content: 'text',
  createdAt: '2026-01-01T00:00:00Z',
  ...over,
});

describe('normalizeCommentStatus', () => {
  it("pending/spam 原样返回", () => {
    expect(normalizeCommentStatus('pending')).toBe('pending');
    expect(normalizeCommentStatus('spam')).toBe('spam');
  });

  it("approved/undefined/空/非法值一律兜底 approved（旧数据可见）", () => {
    expect(normalizeCommentStatus('approved')).toBe('approved');
    expect(normalizeCommentStatus(undefined)).toBe('approved');
    expect(normalizeCommentStatus('')).toBe('approved');
    expect(normalizeCommentStatus('Pending')).toBe('approved'); // 大写是 Notion 层的事，本函数只认小写
    expect(normalizeCommentStatus('deleted')).toBe('approved');
  });
});

describe('buildCommentTree', () => {
  it('扁平列表按 parentId 建树', () => {
    const tree = buildCommentTree([
      c({ id: 'r1' }),
      c({ id: 'r2', parentId: 'r1' }),
      c({ id: 'r3', parentId: 'r2' }),
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('r1');
    expect(tree[0].replies?.[0].id).toBe('r2');
    expect(tree[0].replies?.[0].replies?.[0].id).toBe('r3');
  });

  it('孤儿节点（父不存在）丢弃', () => {
    const tree = buildCommentTree([c({ id: 'a' }), c({ id: 'b', parentId: 'ghost' })]);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('a');
  });

  it('不 mutate 输入且双次调用幂等（修旧 buildCommentTree 重复挂回复 bug）', () => {
    const flat = [c({ id: 'a' }), c({ id: 'b', parentId: 'a' })];
    const snapshot = JSON.stringify(flat);
    const t1 = buildCommentTree(flat);
    const t2 = buildCommentTree(flat);
    expect(JSON.stringify(flat)).toBe(snapshot); // 输入未被挂 replies
    expect(t1[0].replies).toHaveLength(1);
    expect(t2[0].replies).toHaveLength(1);
    expect(JSON.stringify(t1)).toBe(JSON.stringify(t2));
  });
});

describe('filterApprovedTree - 前台口径', () => {
  it('pending/spam 顶级评论不出现', () => {
    const tree = filterApprovedTree([
      c({ id: 'ok' }),
      c({ id: 'pend', status: 'pending' }),
      c({ id: 'bad', status: 'spam' }),
    ]);
    expect(tree.map((x) => x.id)).toEqual(['ok']);
  });

  it('pending/spam 回复不随树吐出', () => {
    const tree = filterApprovedTree([
      c({ id: 'r1' }),
      c({ id: 'good-reply', parentId: 'r1' }),
      c({ id: 'pending-reply', parentId: 'r1', status: 'pending' }),
      c({ id: 'spam-reply', parentId: 'r1', status: 'spam' }),
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].replies?.map((x) => x.id)).toEqual(['good-reply']);
  });

  it('挂在 pending/spam 父评论下的 approved 回复成孤儿不出现', () => {
    const tree = filterApprovedTree([
      c({ id: 'r1' }),
      c({ id: 'hidden', parentId: 'r1', status: 'pending' }),
      c({ id: 'orphan-reply', parentId: 'hidden' }), // approved 但父不可见
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].replies ?? []).toHaveLength(0);
  });

  it('无状态字段的旧数据全部可见（兜底 approved）', () => {
    const legacy = [
      c({ id: 'old1' }),
      c({ id: 'old2', parentId: 'old1' }),
    ];
    const tree = filterApprovedTree(legacy);
    expect(tree).toHaveLength(1);
    expect(tree[0].replies?.[0].id).toBe('old2');
  });
});
