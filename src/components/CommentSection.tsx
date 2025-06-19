import React, { useState, useEffect } from 'react';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import { CommentType } from '@/services/notion';

interface CommentSectionProps {
  postId: string;
  locale?: 'en' | 'zh';
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, locale = 'en' }) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [replyTo, setReplyTo] = useState<{ id: string; parentId: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载评论
  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments?postId=${postId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data.comments || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError(locale === 'zh' ? '加载评论失败' : 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId, locale]);

  // 处理评论提交
  const handleCommentSubmit = async (data: { name: string; email: string; content: string }) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          parentId: null,
          author: {
            name: data.name,
            email: data.email,
          },
          content: data.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }

      const newComment = await response.json();
      
      // 更新评论列表
      setComments(prevComments => [...prevComments, newComment]);
      
      // 重新获取所有评论以确保数据一致性
      await fetchComments();
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert(locale === 'zh' ? '提交评论失败' : 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理回复提交
  const handleReplySubmit = async (data: { name: string; email: string; content: string }) => {
    if (!replyTo) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          parentId: replyTo.id,
          author: {
            name: data.name,
            email: data.email,
          },
          content: data.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit reply');
      }

      const newReply = await response.json();
      
      // 更新评论列表，将回复添加到正确的评论中
      setComments(prevComments => {
        const updatedComments = [...prevComments];
        
        // 查找父评论
        const findAndAddReply = (comments: CommentType[]): boolean => {
          for (let i = 0; i < comments.length; i++) {
            const comment = comments[i];
            
            // 如果是目标评论
            if (comment.id === replyTo.id) {
              if (!comment.replies) {
                comment.replies = [];
              }
              
              // 检查是否已存在相同回复
              const replyExists = comment.replies.some(
                r => r.author && r.author.name === newReply.author?.name && 
                     r.content === newReply.content
              );
              
              if (!replyExists) {
                comment.replies.push(newReply);
              }
              return true;
            }
            
            // 递归检查回复
            if (comment.replies && findAndAddReply(comment.replies)) {
              return true;
            }
          }
          return false;
        };
        
        findAndAddReply(updatedComments);
        return updatedComments;
      });
      
      // 清除回复状态
      setReplyTo(null);
      
      // 重新获取所有评论以确保数据一致性
      await fetchComments();
      
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert(locale === 'zh' ? '提交回复失败' : 'Failed to submit reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理回复按钮点击
  const handleReplyClick = (commentId: string, parentId: string | null) => {
    setReplyTo({ id: commentId, parentId });
  };

  // 处理取消回复
  const handleCancelReply = () => {
    setReplyTo(null);
  };

  // 渲染加载状态
  if (isLoading) {
    return <p>{locale === 'zh' ? '加载评论中...' : 'Loading comments...'}</p>;
  }

  // 渲染错误状态
  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-8">
      {/* 评论列表 */}
      <div>
        <h3 className="text-xl font-bold mb-4">
          {locale === 'zh' ? `评论 (${comments.length})` : `Comments (${comments.length})`}
        </h3>
        
        {comments.length > 0 ? (
          <CommentList comments={comments} onReply={handleReplyClick} locale={locale} />
        ) : (
          <p className="text-gray-500">
            {locale === 'zh' ? '暂无评论。成为第一个评论的人！' : 'No comments yet. Be the first to comment!'}
          </p>
        )}
      </div>

      {/* 回复表单 */}
      {replyTo && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">
            {locale === 'zh' ? '回复评论' : 'Reply to Comment'}
          </h3>
          <CommentForm
            postId={postId}
            parentId={replyTo.id}
            onSubmit={handleReplySubmit}
            onCancel={handleCancelReply}
            isReply={true}
            locale={locale}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* 评论表单 */}
      <div>
        <h3 className="text-xl font-bold mb-4">
          {locale === 'zh' ? '发表评论' : 'Leave a Comment'}
        </h3>
        <CommentForm
          postId={postId}
          parentId={null}
          onSubmit={handleCommentSubmit}
          locale={locale}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default CommentSection; 