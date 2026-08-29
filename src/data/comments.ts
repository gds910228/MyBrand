/**
 * 评论本地兜底层（feat-comment-moderation-20260828 起为唯一本地数据源，spec §1.3）。
 *
 * 历史：本文件曾是零引用的死代码，且与 src/services/notion.ts 内的 localComments
 * 双份重复（类型、种子、建树逻辑各一份）。现已统一：Notion 未配置/调用失败时，
 * notion.ts 的评论读写全部委托到本文件。架构上 src/data/ 本就是「本地兜底层」。
 *
 * - 存储为扁平数组（回复以 parentId 关联），建树/过滤走 src/lib/commentTree 纯函数；
 * - 审核三态完整可用（pending/approved/spam + score/reasons）；
 * - 种子数据不带 status 字段，用于证明旧数据兜底 approved 可见。
 */
import type {
  AdminCommentItem,
  AdminCommentList,
  CommentStatus,
  CommentType,
  NewCommentInput,
} from '@/types/comment';
import { filterApprovedTree, normalizeCommentStatus } from '@/lib/commentTree';

// 种子评论（扁平；无 status 字段 → 兜底 approved）
const SEED_COMMENTS: CommentType[] = [
  {
    id: 'comment-1',
    postId: 'post-getting-started-with-nextjs-14',
    parentId: null,
    author: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80',
    },
    content: "Great article! I've been trying to learn Next.js and this was very helpful.",
    createdAt: '2023-10-26T08:30:00Z',
  },
  {
    id: 'comment-2',
    postId: 'post-getting-started-with-nextjs-14',
    parentId: 'comment-1',
    author: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar:
        'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80',
    },
    content: "Thanks Alice! I'm glad you found it useful. Let me know if you have any questions.",
    createdAt: '2023-10-26T09:15:00Z',
  },
  {
    id: 'comment-3',
    postId: 'post-getting-started-with-nextjs-14',
    parentId: null,
    author: {
      name: 'Robert Smith',
      email: 'robert@example.com',
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=880&q=80',
    },
    content: "I'm still confused about the App Router. Could you explain more about how it differs from the Pages Router?",
    createdAt: '2023-10-27T10:45:00Z',
  },
];

// 注意：App Router dev/build 中不同 route 可能各自持有本模块的实例，
// 挂在 globalThis 上保证评论存储在同一进程的所有路由（POST 写入 / 后台审核）共享。
const globalForComments = globalThis as unknown as {
  __misotechLocalComments?: CommentType[];
  __misotechLocalCommentsCounter?: number;
};

function seedComments(): CommentType[] {
  return SEED_COMMENTS.map((c) => ({ ...c }));
}

if (!globalForComments.__misotechLocalComments) {
  globalForComments.__misotechLocalComments = seedComments();
  globalForComments.__misotechLocalCommentsCounter = 0;
}

let localComments: CommentType[] = globalForComments.__misotechLocalComments;
let idCounter = globalForComments.__misotechLocalCommentsCounter as number;

/** 测试专用：恢复种子数据。 */
export function resetLocalCommentsForTest(): void {
  globalForComments.__misotechLocalComments = seedComments();
  globalForComments.__misotechLocalCommentsCounter = 0;
  localComments = globalForComments.__misotechLocalComments;
  idCounter = 0;
}

/** 前台：按文章取 approved 评论树（pending/spam 顶级与回复均过滤，旧数据兜底可见）。 */
export function getLocalCommentsByPostId(postId: string): CommentType[] {
  const flat = localComments.filter((c) => c.postId === postId);
  return filterApprovedTree(flat);
}

/** 写入一条评论（扁平存储；id/createdAt 在此生成）。 */
export function addLocalComment(input: NewCommentInput): CommentType {
  const counterHolder = globalForComments.__misotechLocalCommentsCounter as number;
  const next = counterHolder + 1;
  globalForComments.__misotechLocalCommentsCounter = next;
  idCounter = next;
  const comment: CommentType = {
    ...input,
    id: `comment-local-${Date.now()}-${next}`,
    createdAt: new Date().toISOString(),
    replies: [],
  };
  localComments.push(comment);
  return comment;
}

/** 状态流转（扁平数组中递归查找，含回复）。返回是否命中。 */
export function setLocalCommentStatus(id: string, status: CommentStatus): boolean {
  const target = localComments.find((c) => c.id === id);
  if (!target) return false;
  target.status = status;
  return true;
}

function clampLimit(limit?: number): number {
  const n = Number.isInteger(limit) ? (limit as number) : 50;
  if (n < 1) return 1;
  if (n > 100) return 100;
  return n;
}

function toAdminItem(c: CommentType): AdminCommentItem {
  return {
    id: c.id,
    postId: c.postId,
    parentId: c.parentId,
    author: {
      name: c.author.name,
      email: c.author.email,
      avatar: c.author.avatar ?? null,
    },
    content: c.content,
    createdAt: c.createdAt,
    status: normalizeCommentStatus(c.status),
    spamScore: typeof c.spamScore === 'number' ? c.spamScore : null,
    spamReasons: Array.isArray(c.spamReasons) ? c.spamReasons : [],
  };
}

/** 后台：全量三态扁平列表（按 createdAt desc，同刻按 id desc）+ 精确计数。 */
export function getAllLocalCommentsForAdmin(options?: {
  status?: CommentStatus | 'all';
  limit?: number;
}): AdminCommentList {
  const statusFilter = options?.status ?? 'all';
  const limit = clampLimit(options?.limit);

  const sorted = [...localComments].sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  });

  const counts = {
    pending: 0,
    spam: 0,
    approved: 0,
    total: localComments.length,
  };
  for (const c of localComments) {
    counts[normalizeCommentStatus(c.status)] += 1;
  }

  const filtered =
    statusFilter === 'all'
      ? sorted
      : sorted.filter((c) => normalizeCommentStatus(c.status) === statusFilter);
  const capped = filtered.length > limit;
  const items = filtered.slice(0, limit).map(toAdminItem);

  return { items, counts, capped, countsCapped: false };
}
