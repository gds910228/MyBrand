'use client';

import React from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { CommentType } from '@/services/notion';

interface CommentListProps {
  comments: CommentType[];
  onReply: (commentId: string, parentId: string | null) => void;
  locale?: 'en' | 'zh';
}

const CommentList: React.FC<CommentListProps> = ({ comments, onReply, locale = 'en' }) => {
  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: locale === 'zh' ? zhCN : undefined
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // 渲染单个评论
  const renderComment = (comment: CommentType, isReply = false) => {
    // 确保author存在
    if (!comment.author) {
      console.error('Comment author is undefined:', comment);
      return null;
    }
    
    const authorName = comment.author.name || 'Anonymous';
    const authorAvatar = comment.author.avatar;
    
    return (
      <div key={comment.id} className={`${isReply ? 'ml-12 mt-4' : 'mt-6'}`}>
        <div className="flex items-start">
          <div className="w-10 h-10 relative rounded-full overflow-hidden mr-4">
            {authorAvatar ? (
              <Image
                src={authorAvatar}
                alt={authorName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary text-white flex items-center justify-center text-lg font-medium">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="bg-neutral-light dark:bg-dark-bg-secondary rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-neutral-darker dark:text-dark-neutral-darker">
                  {authorName}
                </h4>
                <span className="text-xs text-neutral-dark dark:text-dark-neutral-dark">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-neutral-dark dark:text-dark-neutral-dark">
                {comment.content}
              </p>
            </div>
            <button
              onClick={() => onReply(comment.id, comment.parentId)}
              className="mt-2 text-sm text-primary dark:text-dark-primary font-medium hover:underline"
            >
              {locale === 'zh' ? '回复' : 'Reply'}
            </button>
          </div>
        </div>
        
        {/* 渲染回复 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-4">
      {comments.length === 0 ? (
        <p className="text-neutral-dark dark:text-dark-neutral-dark italic">
          {locale === 'zh' ? '还没有评论。成为第一个评论的人！' : 'No comments yet. Be the first to comment!'}
        </p>
      ) : (
        <div>
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
};

export default CommentList; 