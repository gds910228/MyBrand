/**
 * 评论树纯函数（feat-comment-moderation-20260828，spec §1.3）。
 *
 * - 非变异：buildCommentTree 构建全新对象/数组，绝不 mutate 输入
 *   （旧 notion.ts buildCommentTree 直接挂输入对象的 replies，重复 GET 会重复挂回复）。
 * - 状态口径：仅 'pending'/'spam' 原样生效，其余任何值（含 undefined/非法值）
 *   兜底 'approved'，保证旧数据全部可见。
 * - 注意：Notion select 选项名为大写（Pending/Spam），调用方须先 toLowerCase
 *   再经本函数归一（见 notionCommentMapper.mapNotionCommentProps）。
 */
import type { CommentStatus, CommentType } from '@/types/comment';

export function normalizeCommentStatus(raw?: string | null): CommentStatus {
  if (raw === 'pending' || raw === 'spam') return raw;
  return 'approved';
}

/**
 * 公共视图：剥除治理字段（spamScore/spamReasons 绝不出现在任何前台响应，
 * 含 approved 评论——否则可经 GET 反推阈值与规则）。status 保留（无害）。
 */
function toPublicView(c: CommentType): CommentType {
  return {
    id: c.id,
    postId: c.postId,
    parentId: c.parentId,
    author: c.author,
    content: c.content,
    createdAt: c.createdAt,
    status: c.status,
    replies: [],
  };
}

/**
 * 扁平评论列表 → 树。parentId 找不到父的孤儿节点丢弃。
 * 不修改输入；输出节点为浅拷贝（replies 为新数组）。
 */
export function buildCommentTree(flat: CommentType[]): CommentType[] {
  const map = new Map<string, CommentType>();
  for (const c of flat) {
    map.set(c.id, { ...c, replies: [] });
  }
  const roots: CommentType[] = [];
  for (const c of flat) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies!.push(node);
    } else if (!c.parentId) {
      roots.push(node);
    }
    // 孤儿（parentId 非空但父不在集合中）：丢弃
  }
  return roots;
}

/**
 * 前台口径：先过滤出 approved（旧数据无状态字段兜底 approved），再建树。
 * pending/spam 顶级与回复均不出现；挂在隐藏父评论下的回复成孤儿丢弃。
 */
export function filterApprovedTree(flat: CommentType[]): CommentType[] {
  const approved = flat
    .filter((c) => normalizeCommentStatus(c.status) === 'approved')
    .map(toPublicView);
  return buildCommentTree(approved);
}
