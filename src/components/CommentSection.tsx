'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import type { CommentType } from '@/services/notion';
import { getCommentMessages } from '@/lib/commentMessages';

interface CommentSectionProps {
  postId: string;
  locale?: 'en' | 'zh';
}

type SubmitFeedback =
  | { kind: 'approved' }
  | { kind: 'pending' }
  | { kind: 'rate_limited' }
  | { kind: 'error' }
  | null;

const CommentSection: React.FC<CommentSectionProps> = ({ postId, locale = 'en' }) => {
  const t = getCommentMessages(locale);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [replyTo, setReplyTo] = useState<{ id: string; parentId: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<SubmitFeedback>(null);

  // 加载评论（前台仅返回 approved；被审评论不占位、不闪烁）
  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data.comments || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(t.section.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [postId, t.section.loadFailed]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 评论/回复统一提交：按 moderation 三态反馈；返回是否成功（失败/限流时表单保留输入）
  const submitComment = useCallback(
    async (data: { name: string; email: string; content: string }): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        setFeedback(null);
        const response = await fetch('/api/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId,
            parentId: replyTo ? replyTo.id : null,
            author: {
              name: data.name,
              email: data.email,
            },
            content: data.content,
            locale,
          }),
        });

        if (response.status === 429) {
          setFeedback({ kind: 'rate_limited' });
          return false;
        }

        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.ok) {
          setFeedback({ kind: 'error' });
          return false;
        }

        if (body.moderation === 'approved') {
          setFeedback({ kind: 'approved' });
        } else {
          // pending 与 spam 响应同构（防探测），统一提示待审核
          setFeedback({ kind: 'pending' });
        }

        // 清回复态并重新拉取（approved 立即出现；pending/spam 不出现，不占位）
        setReplyTo(null);
        await fetchComments();
        return true;
      } catch (err) {
        console.error('Error submitting comment:', err);
        setFeedback({ kind: 'error' });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [postId, locale, replyTo, fetchComments],
  );

  const handleReplyClick = (commentId: string, parentId: string | null) => {
    setFeedback(null);
    setReplyTo({ id: commentId, parentId });
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  if (isLoading) {
    return <p>{t.section.loading}</p>;
  }

  if (error) {
    return (
      <div>
        <p className="text-red-500 dark:text-red-400">{error}</p>
        <button
          onClick={fetchComments}
          className="mt-2 text-sm text-primary dark:text-dark-primary hover:underline"
        >
          {t.section.retry}
        </button>
      </div>
    );
  }

  const feedbackBanner = (() => {
    if (!feedback) return null;
    const cls =
      feedback.kind === 'approved'
        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50'
        : feedback.kind === 'pending'
          ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
          : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50';
    const message =
      feedback.kind === 'approved'
        ? t.section.successApproved
        : feedback.kind === 'pending'
          ? t.section.successPending
          : feedback.kind === 'rate_limited'
            ? t.section.rateLimited
            : t.section.submitFailed;
    return (
      <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${cls}`} role="status">
        {message}
      </div>
    );
  })();

  return (
    <div className="space-y-8">
      {/* 评论列表 */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
          {t.section.count.replace('{count}', String(comments.length))}
        </h3>

        {comments.length > 0 ? (
          <CommentList comments={comments} onReply={handleReplyClick} locale={locale} />
        ) : (
          <p className="text-gray-500 dark:text-gray-400">{t.list.empty}</p>
        )}
      </div>

      {/* 回复表单 */}
      {replyTo && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2 text-neutral-900 dark:text-neutral-100">
            {t.section.replyTo}
          </h3>
          <CommentForm
            postId={postId}
            parentId={replyTo.id}
            onSubmit={submitComment}
            onCancel={handleCancelReply}
            isReply={true}
            locale={locale}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* 提交反馈 + 评论表单 */}
      <div>
        {feedbackBanner}
        <h3 className="text-xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
          {t.section.title}
        </h3>
        <CommentForm
          postId={postId}
          parentId={null}
          onSubmit={submitComment}
          locale={locale}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default CommentSection;
