import React, { useState } from 'react';

interface CommentFormProps {
  postId: string;
  parentId: string | null;
  onSubmit: (data: { name: string; email: string; content: string }) => void;
  onCancel?: () => void;
  isReply?: boolean;
  locale?: 'en' | 'zh';
  isSubmitting?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({ 
  postId, 
  parentId, 
  onSubmit, 
  onCancel, 
  isReply = false,
  locale = 'en',
  isSubmitting = false
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = locale === 'zh' ? '请输入您的姓名' : 'Please enter your name';
    }
    
    if (!email.trim()) {
      newErrors.email = locale === 'zh' ? '请输入您的邮箱' : 'Please enter your email';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = locale === 'zh' ? '请输入有效的邮箱地址' : 'Please enter a valid email address';
    }
    
    if (!content.trim()) {
      newErrors.content = locale === 'zh' ? '请输入评论内容' : 'Please enter a comment';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && !isSubmitting) {
      onSubmit({ name, email, content });
      // 重置表单
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
            <label htmlFor="name" className="block text-sm font-medium text-neutral-dark dark:text-dark-neutral-dark mb-1">
              {locale === 'zh' ? '姓名' : 'Name'} *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <label htmlFor="email" className="block text-sm font-medium text-neutral-dark dark:text-dark-neutral-dark mb-1">
              {locale === 'zh' ? '邮箱' : 'Email'} *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          <label htmlFor="content" className="block text-sm font-medium text-neutral-dark dark:text-dark-neutral-dark mb-1">
            {locale === 'zh' ? '评论' : 'Comment'} *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
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
              {locale === 'zh' ? '取消' : 'Cancel'}
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
              ? (locale === 'zh' ? '提交中...' : 'Submitting...') 
              : isReply 
                ? (locale === 'zh' ? '提交回复' : 'Submit Reply') 
                : (locale === 'zh' ? '提交评论' : 'Submit Comment')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentForm; 