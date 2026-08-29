'use client';

import React, { useState } from 'react';
import { getCommentMessages } from '@/lib/commentMessages';

interface CommentFormProps {
  postId: string;
  parentId: string | null;
  /** 返回 true 表示提交成功（表单清空）；false/失败时保留输入便于重试 */
  onSubmit: (data: { name: string; email: string; content: string }) => Promise<boolean> | boolean;
  onCancel?: () => void;
  isReply?: boolean;
  locale?: 'en' | 'zh';
  isSubmitting?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  isReply = false,
  locale = 'en',
  isSubmitting = false,
}) => {
  const t = getCommentMessages(locale);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 表单验证（文案全部来自 i18n）
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t.form.nameRequired;
    }

    if (!email.trim()) {
      newErrors.email = t.form.emailRequired;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = t.form.emailInvalid;
    }

    if (!content.trim()) {
      newErrors.content = t.form.contentRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单：成功才清空；失败/限流保留输入便于重试
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;
    const ok = await onSubmit({ name, email, content });
    if (ok) {
      setName('');
      setEmail('');
      setContent('');
    }
  };

  return (
    <div className={`${isReply ? 'mt-4' : 'mt-8'}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="comment-name" className="block text-sm font-medium text-neutral-dark dark:text-dark-neutral-dark mb-1">
              {t.form.name} *
            </label>
            <input
              type="text"
              id="comment-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.form.namePlaceholder}
              className={`w-full px-4 py-2 rounded-md border ${
                errors.name
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-neutral-light dark:border-dark-neutral-light'
              } bg-white dark:bg-dark-neutral-darker focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary`}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="comment-email" className="block text-sm font-medium text-neutral-dark dark:text-dark-neutral-dark mb-1">
              {t.form.email} *
            </label>
            <input
              type="email"
              id="comment-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.form.emailPlaceholder}
              className={`w-full px-4 py-2 rounded-md border ${
                errors.email
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-neutral-light dark:border-dark-neutral-light'
              } bg-white dark:bg-dark-neutral-darker focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary`}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.email}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="comment-content" className="block text-sm font-medium text-neutral-dark dark:text-dark-neutral-dark mb-1">
            {t.form.content} *
          </label>
          <textarea
            id="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder={t.form.contentPlaceholder}
            className={`w-full px-4 py-2 rounded-md border ${
              errors.content
                ? 'border-red-500 dark:border-red-400'
                : 'border-neutral-light dark:border-dark-neutral-light'
            } bg-white dark:bg-dark-neutral-darker focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary`}
            disabled={isSubmitting}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.content}</p>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          {isReply && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-neutral-dark dark:text-dark-neutral-dark hover:bg-neutral-light dark:hover:bg-dark-bg-secondary rounded-md transition-colors"
              disabled={isSubmitting}
            >
              {t.form.cancel}
            </button>
          )}
          <button
            type="submit"
            className={`px-6 py-2 ${
              isSubmitting
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-primary dark:bg-dark-primary hover:bg-primary-dark dark:hover:bg-dark-primary-dark'
            } text-white rounded-md transition-colors`}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t.form.submitting
              : isReply
                ? t.form.submitReply
                : t.form.submit}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentForm;
