/**
 * 评论域共享类型（feat-comment-moderation-20260828）。
 *
 * 历史：CommentType 曾在 src/services/notion.ts 与 src/data/comments.ts 各定义一份；
 * 按工程结构规则（跨层共享类型入 src/types）统一到此处，notion.ts re-export 保持
 * 既有 import 路径（@/services/notion）兼容。
 */

/** 评论审核状态机三态。旧数据无状态字段时一律兜底 'approved'（见 commentTree.normalizeCommentStatus）。 */
export type CommentStatus = 'pending' | 'approved' | 'spam';

export interface CommentAuthor {
  name: string;
  email: string;
  avatar?: string | null;
}

export interface CommentType {
  id: string;
  postId: string;
  parentId: string | null; // null=顶级评论；非 null=回复
  author: CommentAuthor;
  content: string;
  createdAt: string;
  replies?: CommentType[];
  // ── 审核治理字段（可选：旧数据/旧调用方不感知）──────────────────────────
  /** 审核状态；缺省按 approved 处理（存量评论保持可见）。 */
  status?: CommentStatus;
  /** 反垃圾评分 0-100；仅后台/站长邮件可见，前台响应剥除。 */
  spamScore?: number;
  /** 命中规则码列表（机器码，不含用户输入原文）。 */
  spamReasons?: string[];
}

/** 新建评论入参（id/createdAt 由数据层生成）。 */
export type NewCommentInput = Omit<CommentType, 'id' | 'createdAt'>;

/** 后台审核列表条目（扁平，含全部三态与治理字段；作者邮箱供站长排查）。 */
export interface AdminCommentItem {
  id: string;
  postId: string;
  parentId: string | null;
  author: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  content: string;
  createdAt: string;
  status: CommentStatus;
  spamScore: number | null;
  spamReasons: string[];
}

/** 后台列表返回：条目 + 三态计数 + 是否触达上限。 */
export interface AdminCommentList {
  items: AdminCommentItem[];
  counts: {
    pending: number;
    spam: number;
    approved: number;
    total: number;
  };
  /** true=列表结果受 page_size 上限截断（UI 提示「仅显示最新 N 条」）。 */
  capped: boolean;
  /** true=三态计数触达 100 上限（徽标追加「+」）。 */
  countsCapped: boolean;
}

/** 评分引擎结果。 */
export interface ModerationResult {
  score: number;
  reasons: string[];
  decision: CommentStatus;
}
